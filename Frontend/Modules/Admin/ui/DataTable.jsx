import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../Api/client";
import AdminIcon from "./AdminIcon";
import { Btn, Confirm, EmptyState, IconBtn, Spinner, compactInput, inputClass } from "./kit";
import { csvValue, renderCell } from "./cells";
import { titleWords } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";

function Dropdown({ button, children, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {button({ open, toggle: () => setOpen((v) => !v) })}
      {open && <div className={`admin-pop absolute top-full z-30 mt-1.5 min-w-52 rounded-md border border-slate-200 bg-white p-2 shadow-xl ${align === "right" ? "right-0" : "left-0"}`}>{children}</div>}
    </div>
  );
}

const EMPTY = new Set();

const readHidden = (key, columns) => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(`pscdb-admin-cols-${key}`));
    if (Array.isArray(saved)) return new Set(saved);
  } catch {
    /* Storage can be unavailable; fall back to defaults. */
  }
  return new Set(columns.filter((c) => c.hidden).map((c) => c.key));
};

export default function DataTable({ config, reloadKey = 0, onAdd, onEdit, onView, extraActions, extraTools, initialFilters = {} }) {
  const { me, toast } = useAdmin();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [range, setRange] = useState({ from: "", to: "" });
  const [sort, setSort] = useState(config.defaultSort || "-createdAt");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hidden, setHidden] = useState(() => readHidden(config.key, config.columns));
  // Selection belongs to one load of the data; a reload from outside clears it.
  const [selection, setSelection] = useState({ key: reloadKey, ids: new Set() });
  const selected = selection.key === reloadKey ? selection.ids : EMPTY;
  const setSelected = (update) => setSelection((current) => ({ key: reloadKey, ids: typeof update === "function" ? update(current.key === reloadKey ? current.ids : EMPTY) : update }));
  const [state, setState] = useState({ loading: true, rows: [], total: 0, error: "" });
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const canCreate = onAdd && hasRole(me, config.can?.create ?? "manager");
  const canUpdate = onEdit && hasRole(me, config.can?.update ?? "manager");
  const canDelete = !config.readOnly && hasRole(me, config.can?.delete ?? "manager");
  const visible = config.columns.filter((c) => !hidden.has(c.key));

  // Debounce typing in the search box.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const params = useCallback(
    (extra = {}) => {
      const p = new URLSearchParams({ page: String(page), limit: String(limit), sort, ...extra });
      if (query) p.set("q", query);
      for (const [key, value] of Object.entries(filters)) if (value !== "" && value !== undefined) p.set(key, value);
      if (range.from) p.set("from", range.from);
      if (range.to) p.set("to", range.to);
      return p;
    },
    [page, limit, sort, query, filters, range],
  );

  useEffect(() => {
    const controller = new AbortController();
    api(`${config.endpoint}?${params()}`, { signal: controller.signal }).then((result) => {
      if (result.aborted) return;
      if (result.ok) setState({ loading: false, rows: result.data.rows, total: result.data.total, error: "" });
      else setState((s) => ({ ...s, loading: false, error: result.message || "Could not load records." }));
    });
    return () => controller.abort();
  }, [config.endpoint, params, reloadKey, tick]);

  const refresh = () => {
    setState((s) => ({ ...s, loading: true }));
    setSelected(new Set());
    setTick((t) => t + 1);
  };

  const pages = Math.max(Math.ceil(state.total / limit), 1);
  const toggleSort = (key) => {
    setSort((current) => (current === key ? `-${key}` : current === `-${key}` ? key : `-${key}`));
    setPage(1);
  };
  const toggleColumn = (key) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (config.columns.length - next.size > 1) next.add(key);
      try {
        window.localStorage.setItem(`pscdb-admin-cols-${config.key}`, JSON.stringify([...next]));
      } catch {
        /* Ignore storage errors. */
      }
      return next;
    });
  };
  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const activeFilters = Object.values(filters).filter(Boolean).length + (range.from || range.to ? 1 : 0) + (query ? 1 : 0);
  const clearAll = () => {
    setQ("");
    setQuery("");
    setFilters({});
    setRange({ from: "", to: "" });
    setPage(1);
  };

  const allOnPage = state.rows.length > 0 && state.rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((current) => {
    const next = new Set(current);
    if (allOnPage) state.rows.forEach((r) => next.delete(r.id));
    else state.rows.forEach((r) => next.add(r.id));
    return next;
  });
  const toggleRow = (id) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const runDelete = async () => {
    setBusy(true);
    const ids = confirm.ids;
    const result = ids.length === 1
      ? await api(`${config.endpoint}/${ids[0]}`, { method: "DELETE" })
      : await api(`${config.endpoint}/bulk-delete`, { method: "POST", body: { ids } });
    setBusy(false);
    setConfirm(null);
    if (!result.ok) {
      toast({ tone: "error", title: "Not Deleted", message: result.message });
      return;
    }
    const skipped = result.data?.skipped || [];
    const deleted = ids.length === 1 ? 1 : result.data?.deleted ?? 0;
    toast({ tone: skipped.length ? "warning" : "success", title: `${deleted} ${deleted === 1 ? config.singular : config.plural || `${config.singular}s`} deleted`, message: skipped.length ? `${skipped.length} skipped: ${skipped[0].reason}` : undefined });
    refresh();
  };

  const exportCsv = async () => {
    setExporting(true);
    const result = await api(`${config.endpoint}?${params({ export: "1", page: "1", limit: "5000" })}`);
    setExporting(false);
    if (!result.ok) {
      toast({ tone: "error", title: "Export Failed", message: result.message });
      return;
    }
    const cols = visible.filter((c) => c.csv !== false);
    // Cells starting with = + - @ or a control character could run as formulas in Excel: prefix them with '.
    const escape = (v) => {
      const text = String(v);
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const lines = [cols.map((c) => escape(c.label)).join(","), ...result.data.rows.map((row) => cols.map((c) => escape(csvValue(c, row))).join(","))];
    const blob = new Blob([`\ufeff${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pscdb-${config.key}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ tone: "success", title: `Exported ${result.data.rows.length} rows` });
  };

  const first = state.total ? (page - 1) * limit + 1 : 0;
  const last = Math.min(page * limit, state.total);
  const pageList = useMemo(() => {
    const list = [];
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    for (let p = start; p <= Math.min(pages, start + 4); p += 1) list.push(p);
    return list;
  }, [page, pages]);

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <AdminIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={config.searchPlaceholder || "Search…"} aria-label={`Search ${config.title.toLowerCase()}`} className={`${inputClass} pl-8`} />
          </div>
          {(config.filters || []).map((f) => (
            <select key={f.key} aria-label={f.label} value={filters[f.key] ?? ""} onChange={(e) => setFilter(f.key, e.target.value)} className={`${compactInput} min-w-[8.5rem] pr-8`}>
              <option value="">{f.label}: All</option>
              {f.options.map((o) => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          {config.dateFilter && (
            <div className="flex items-center gap-1.5">
              <input type="date" aria-label="From date" value={range.from} onChange={(e) => { setRange((r) => ({ ...r, from: e.target.value })); setPage(1); }} className={`${compactInput}`} />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" aria-label="To date" value={range.to} onChange={(e) => { setRange((r) => ({ ...r, to: e.target.value })); setPage(1); }} className={`${compactInput}`} />
            </div>
          )}
          {activeFilters > 0 && <Btn variant="ghost" size="sm" icon="close" onClick={clearAll}>Clear ({activeFilters})</Btn>}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {extraTools}
            <Dropdown button={({ toggle, open }) => <Btn icon="columns" onClick={toggle} aria-expanded={open}>Columns</Btn>}>
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Show Columns</p>
              {config.columns.map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleColumn(c.key)} className="h-4 w-4 accent-emerald-700" />
                  {c.label}
                </label>
              ))}
            </Dropdown>
            {hasRole(me, "manager") && <Btn icon="download" onClick={exportCsv} disabled={exporting || !state.total}>{exporting ? "Exporting…" : "Export CSV"}</Btn>}
            <IconBtn icon="refresh" label="Refresh" onClick={refresh} />
            {canCreate && <Btn variant="primary" icon="plus" onClick={onAdd}>Add {titleWords(config.singular)}</Btn>}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="admin-pop flex flex-wrap items-center justify-between gap-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-600/20">
            <span><strong>{selected.size}</strong> selected</span>
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear Selection</Btn>
              {canDelete && <Btn size="sm" variant="danger" icon="trash" onClick={() => setConfirm({ ids: [...selected] })}>Delete Selected</Btn>}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        {state.loading && state.rows.length > 0 && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/60"><Spinner className="h-6 w-6 text-emerald-700" /></div>
        )}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr className="border-b border-slate-200">
              {canDelete && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={toggleAll} className="h-4 w-4 accent-emerald-700" />
                </th>
              )}
              {visible.map((c) => {
                const active = sort.replace(/^-/, "") === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort.startsWith("-") ? "descending" : "ascending") : undefined} className={`whitespace-nowrap px-4 py-3 font-bold ${c.align === "right" ? "text-right" : ""}`}>
                    {c.sortable ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-800 ${active ? "text-slate-800" : ""}`}>
                        {c.label}
                        <AdminIcon name={active ? (sort.startsWith("-") ? "sortDown" : "sortUp") : "sort"} className={`h-3.5 w-3.5 ${active ? "text-emerald-700" : "text-slate-300"}`} strokeWidth={2.2} />
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
              <th scope="col" className="sticky right-0 w-px whitespace-nowrap bg-slate-50 px-4 py-3 text-right font-bold shadow-[-10px_0_10px_-10px_rgba(15,23,42,0.18)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.loading && state.rows.length === 0 &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  {canDelete && <td className="px-4 py-3.5"><span className="skeleton block h-4 w-4" /></td>}
                  {visible.map((c) => <td key={c.key} className="px-4 py-3.5"><span className="skeleton block h-4 w-full max-w-[9rem]" /></td>)}
                  <td className="px-4 py-3.5"><span className="skeleton ml-auto block h-4 w-16" /></td>
                </tr>
              ))}
            {state.rows.map((row) => (
              <tr key={row.id} className={`transition-colors hover:bg-slate-50/80 ${selected.has(row.id) ? "bg-emerald-50/50" : ""}`}>
                {canDelete && (
                  <td className="px-4 py-2.5">
                    <input type="checkbox" aria-label="Select row" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 accent-emerald-700" />
                  </td>
                )}
                {visible.map((c) => (
                  <td key={c.key} className={`px-4 py-2.5 text-slate-600 ${c.align === "right" ? "text-right" : ""} ${c.className || ""}`}>{renderCell(c, row)}</td>
                ))}
                <td className={`sticky right-0 px-4 py-2 shadow-[-10px_0_10px_-10px_rgba(15,23,42,0.18)] ${selected.has(row.id) ? "bg-emerald-50" : "bg-white"}`}>
                  <div className="flex justify-end gap-0.5">
                    {extraActions?.(row)}
                    {onView && <IconBtn icon="eye" label="View" tone="blue" onClick={() => onView(row)} />}
                    {canUpdate && (!config.canEditRow || config.canEditRow(row)) && <IconBtn icon="edit" label="Edit" tone="amber" onClick={() => onEdit(row)} />}
                    {canDelete && <IconBtn icon="trash" label="Delete" tone="red" onClick={() => setConfirm({ ids: [row.id], label: config.describe ? config.describe(row) : "" })} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!state.loading && state.rows.length === 0 && (
          <EmptyState icon={config.icon} title={state.error || (activeFilters ? "No records match these filters" : `No ${config.plural || `${config.singular}s`} yet`)}>
            {!state.error && (activeFilters ? "Try a different search or clear the filters." : canCreate ? `Use “Add ${config.singular}” to create the first one.` : null)}
          </EmptyState>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 md:flex-row">
        <div className="flex items-center gap-3">
          <span aria-live="polite">Showing <strong className="text-slate-700">{first}</strong> to <strong className="text-slate-700">{last}</strong> of <strong className="text-slate-700">{state.total}</strong> entries</span>
          <select aria-label="Rows per page" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className={`${compactInput} h-8 pr-7`}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <IconBtn icon="chevronLeft" label="Previous Page" disabled={page <= 1} onClick={() => setPage(page - 1)} />
          {pageList[0] > 1 && <><PageBtn n={1} page={page} setPage={setPage} />{pageList[0] > 2 && <span className="px-1">…</span>}</>}
          {pageList.map((n) => <PageBtn key={n} n={n} page={page} setPage={setPage} />)}
          {pageList.at(-1) < pages && <>{pageList.at(-1) < pages - 1 && <span className="px-1">…</span>}<PageBtn n={pages} page={page} setPage={setPage} /></>}
          <IconBtn icon="chevronRight" label="Next Page" disabled={page >= pages} onClick={() => setPage(page + 1)} />
        </nav>
      </div>

      <Confirm
        open={Boolean(confirm)}
        busy={busy}
        title={confirm?.ids.length > 1 ? `Delete ${confirm.ids.length} records?` : `Delete this ${config.singular}?`}
        message={confirm?.ids.length > 1 ? `The selected records will be permanently deleted. Records that are still in use will be skipped.` : `${confirm?.label ? `${confirm.label} will be` : "This record will be"} permanently deleted. This cannot be undone.`}
        onConfirm={runDelete}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

function PageBtn({ n, page, setPage }) {
  return (
    <button type="button" aria-current={n === page ? "page" : undefined} onClick={() => setPage(n)} className={`tabular h-8 min-w-8 rounded-md px-2 text-sm font-semibold transition-colors ${n === page ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
      {n}
    </button>
  );
}
