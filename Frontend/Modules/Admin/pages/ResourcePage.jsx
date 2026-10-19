import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../Api/client";
import AdminIcon from "../ui/AdminIcon";
import DataTable from "../ui/DataTable";
import { renderCell } from "../ui/cells";
import RecordForm from "../ui/RecordForm";
import { Badge, Btn, Confirm, IconBtn, Spinner, inputClass } from "../ui/kit";
import { date, dayLabel, time, usd } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";
import { resources } from "../lib/resources";
import PageHeader from "../ui/PageHeader";

/* Slide-over panel with every field of a record, plus related records when the API sends them. */
function DetailDrawer({ config, row, onClose, onEdit, canEdit }) {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api(`${config.endpoint}/${row.id}`, { signal: controller.signal }).then((r) => r.ok && setDetail(r.data));
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      controller.abort();
      document.removeEventListener("keydown", onKey);
    };
  }, [config.endpoint, row.id, onClose]);
  const data = detail || row;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`${config.singular} details`}>
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="admin-slide absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{config.singular}</p>
            <h2 className="font-display text-lg font-bold text-slate-800">{config.describe ? config.describe(data) : data.name}</h2>
          </div>
          <div className="flex gap-1">
            {canEdit && <Btn size="sm" icon="edit" onClick={() => onEdit(row)}>Edit</Btn>}
            <IconBtn icon="close" label="Close" onClick={onClose} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {config.columns.map((c) => (
              <div key={c.key} className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</dt>
                <dd className="mt-1 break-words text-sm text-slate-700">{renderCell(c, data)}</dd>
              </div>
            ))}
            {data.notes && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{data.notes}</dd>
              </div>
            )}
            {config.key === "enquiries" && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full message</dt>
                <dd className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">{data.message}</dd>
                <a href={`mailto:${data.email}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"><AdminIcon name="enquiries" className="h-4 w-4" /> Reply by email</a>
              </div>
            )}
          </dl>

          {!detail && <div className="mt-6 flex justify-center text-slate-400"><Spinner /></div>}
          {detail?.enrolments && (
            <section className="mt-8">
              <h3 className="font-display text-sm font-bold text-slate-800">Enrolments ({detail.enrolments.length})</h3>
              <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
                {detail.enrolments.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">No enrolments yet.</li>}
                {detail.enrolments.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span className="min-w-0"><span className="font-mono text-xs font-semibold text-slate-500">{e.reference}</span><span className="block truncate text-slate-700">{e.courseCode} {e.courseTitle}</span></span>
                    <span className="text-right"><Badge value={e.status} /><span className="tabular mt-0.5 block text-xs text-slate-500">{usd(e.totalUsd)} · {date(e.createdAt)}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {detail?.attendance && (
            <section className="mt-8">
              <h3 className="font-display text-sm font-bold text-slate-800">Recent attendance</h3>
              <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
                {detail.attendance.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">No attendance recorded yet.</li>}
                {detail.attendance.slice(0, 20).map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-700">{dayLabel(a.date)}</span>
                    <span className="flex items-center gap-3"><span className="tabular text-xs text-slate-500">{time(a.checkInAt) || "—"} to {time(a.checkOutAt) || "—"}</span><Badge value={a.status} /></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {detail?.courses && (
            <section className="mt-8">
              <h3 className="font-display text-sm font-bold text-slate-800">Used by</h3>
              <p className="mt-2 text-sm text-slate-600">{detail.courses.length} course batches and {detail.staffCount} staff members.</p>
            </section>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

/* Edits a course's batches: one per shift, with capacity. Booked seats are protected by the server. */
function BatchEditor({ course, onClose, onSaved }) {
  const { lookups, toast } = useAdmin();
  const [rows, setRows] = useState(() => course.batches.map((b) => ({ id: b.id, label: b.label, timing: b.timing, capacity: b.capacity, booked: b.capacity - b.seatsAvailable })));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const unused = lookups.shifts.filter((s) => !rows.some((r) => r.id === s.value));
  const update = (index, patch) => setRows((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const save = async () => {
    setBusy(true);
    setError("");
    const result = await api(`/admin/courses/${course.id}/batches`, { method: "PUT", body: { batches: rows.map((r) => ({ id: r.id, label: r.label, timing: r.timing, capacity: Number(r.capacity) })) } });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    toast({ tone: "success", title: "Batches saved", message: `${course.code} now has ${result.data.length} batches.` });
    onSaved();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={`Batches for ${course.code}`}>
      <div className="admin-pop my-auto w-full max-w-3xl rounded-lg bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="font-display text-base font-bold text-slate-800">Batches for {course.code} {course.title}</h2>
          <IconBtn icon="close" label="Close" onClick={onClose} />
        </header>
        <div className="space-y-3 px-5 py-5">
          {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="pb-2">Shift</th><th className="pb-2">Label</th><th className="pb-2">Timing</th><th className="pb-2">Seats</th><th className="pb-2">Booked</th><th /></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className="align-top">
                    <td className="py-1.5 pr-2"><Badge value="staff">{lookups.shifts.find((s) => s.value === r.id)?.label.split(" (")[0] || r.id}</Badge></td>
                    <td className="py-1.5 pr-2"><input aria-label="Label" value={r.label} onChange={(e) => update(i, { label: e.target.value })} className={inputClass} /></td>
                    <td className="py-1.5 pr-2"><input aria-label="Timing" value={r.timing} onChange={(e) => update(i, { timing: e.target.value })} className={inputClass} /></td>
                    <td className="w-24 py-1.5 pr-2"><input aria-label="Seats" type="number" min={r.booked} max="1000" value={r.capacity} onChange={(e) => update(i, { capacity: e.target.value })} className={inputClass} /></td>
                    <td className="tabular py-3 pr-2 text-slate-600">{r.booked}</td>
                    <td className="py-1.5"><IconBtn icon="trash" tone="red" label={r.booked ? "Has bookings" : "Remove batch"} disabled={r.booked > 0} onClick={() => setRows((list) => list.filter((_, j) => j !== i))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unused.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-500">Add a batch:</span>
              {unused.map((s) => <Btn key={s.value} size="sm" icon="plus" onClick={() => setRows((list) => [...list, { id: s.value, label: `${s.label.split(" (")[0]} batch`, timing: s.label.match(/\((.*)\)/)?.[1] || "", capacity: 50, booked: 0 }])}>{s.label}</Btn>)}
            </div>
          )}
          <p className="text-xs text-slate-500">Seats cannot go below the number already booked, and batches with bookings cannot be removed.</p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />}Save batches</Btn>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export default function ResourcePage({ name, openNew = false }) {
  const config = resources[name];
  const { me, lookups, refreshLookups, toast } = useAdmin();
  const [form, setForm] = useState(() => (openNew && resources[name].form.length ? { row: null } : null));
  const [viewing, setViewing] = useState(null);
  const [batches, setBatches] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [absent, setAbsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const filters = useMemo(() => (typeof config.filters === "function" ? config.filters(lookups) : config.filters || []), [config, lookups]);
  const tableConfig = useMemo(() => ({ ...config, filters }), [config, filters]);
  const canUpdate = hasRole(me, config.can?.update ?? "manager");
  const closeView = useCallback(() => setViewing(null), []);

  const saved = () => {
    setForm(null);
    setReloadKey((k) => k + 1);
    if (["courses", "shifts", "centres"].includes(name)) refreshLookups();
  };

  const markAbsent = async () => {
    setBusy(true);
    const result = await api("/admin/attendance/mark-absent", { method: "POST", body: {} });
    setBusy(false);
    setAbsent(false);
    if (!result.ok) return toast({ tone: "error", title: "Could not mark absentees", message: result.message });
    toast({ tone: "success", title: `${result.data.marked} marked absent`, message: `For ${dayLabel(result.data.date)}.` });
    setReloadKey((k) => k + 1);
  };

  const transform = name === "enrolments" ? (body, row) => (row ? { status: body.status, batchId: body.batchId, paymentNote: body.paymentNote } : body) : undefined;

  return (
    <>
      <PageHeader title={config.title} crumbs={[config.title]} icon={config.icon} />
      <DataTable
        config={tableConfig}
        reloadKey={reloadKey}
        onAdd={config.readOnly || name === "attendance" ? undefined : () => setForm({ row: null })}
        onEdit={config.readOnly ? undefined : (row) => setForm({ row })}
        onView={(row) => setViewing(row)}
        extraActions={name === "courses" && hasRole(me, "manager") ? (row) => <IconBtn icon="layers" label="Batches" tone="green" onClick={() => setBatches(row)} /> : undefined}
        extraTools={name === "attendance" && hasRole(me, "manager") ? <Btn icon="alert" onClick={() => setAbsent(true)}>Mark absentees</Btn> : name === "attendance" ? null : undefined}
      />

      {form && (
        <RecordForm
          key={form.row?.id || "new"}
          open
          title={form.row ? `Edit ${config.singular}` : `Add ${config.singular}`}
          fields={config.form}
          row={form.row}
          endpoint={config.endpoint}
          transform={transform}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {viewing && <DetailDrawer config={config} row={viewing} onClose={closeView} canEdit={!config.readOnly && canUpdate} onEdit={(row) => { setViewing(null); setForm({ row }); }} />}
      {batches && <BatchEditor course={batches} onClose={() => setBatches(null)} onSaved={() => { setBatches(null); setReloadKey((k) => k + 1); refreshLookups(); }} />}
      <Confirm
        open={absent}
        tone="primary"
        confirmLabel="Mark absent"
        busy={busy}
        title="Mark today's absentees?"
        message="Every active enrolled student and active staff member without an attendance record today will be marked absent. You can edit any record afterwards."
        onConfirm={markAbsent}
        onClose={() => setAbsent(false)}
      />
    </>
  );
}
