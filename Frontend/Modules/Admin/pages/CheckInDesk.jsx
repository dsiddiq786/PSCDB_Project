import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../Api/client";
import AdminIcon from "../ui/AdminIcon";
import PageHeader from "../ui/PageHeader";
import { Badge, Btn, Card, EmptyState, InfoBox, Spinner, inputClass } from "../ui/kit";
import { dayLabel, initials, label, time } from "../lib/format";
import { useAdmin } from "../lib/adminContext";

export default function CheckInDesk() {
  const { toast } = useAdmin();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [today, setToday] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Today's log refreshes every 30 seconds and after every check-in.
  useEffect(() => {
    const controller = new AbortController();
    api("/admin/checkin/today", { signal: controller.signal }).then((r) => r.ok && setToday(r.data));
    const timer = window.setTimeout(() => setTick((t) => t + 1), 30000);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [tick]);

  const search = useCallback((term) => {
    const controller = new AbortController();
    if (term.trim().length < 2) {
      setResults([]);
      return controller;
    }
    setSearching(true);
    api(`/admin/checkin/lookup?q=${encodeURIComponent(term.trim())}`, { signal: controller.signal }).then((r) => {
      if (r.aborted) return;
      setSearching(false);
      if (r.ok) setResults(r.data);
    });
    return controller;
  }, []);

  useEffect(() => {
    let controller;
    const timer = window.setTimeout(() => {
      controller = search(q);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller?.abort();
    };
  }, [q, search]);

  const act = async (personItem, action) => {
    setBusyId(`${personItem.id}-${action}`);
    const result = await api("/admin/checkin", { method: "POST", body: { personType: personItem.personType, id: personItem.id, action } });
    setBusyId("");
    if (!result.ok) {
      toast({ tone: "error", title: action === "in" ? "Check-in failed" : "Check-out failed", message: result.message });
      return;
    }
    toast({
      tone: result.data.status === "late" && action === "in" ? "warning" : "success",
      title: `${personItem.name} checked ${action}`,
      message: action === "in" ? `Marked ${label(result.data.status).toLowerCase()} at ${time(result.data.checkInAt)}.` : `Left at ${time(result.data.checkOutAt)}.`,
    });
    setResults((list) => list.map((p) => (p.id === personItem.id ? { ...p, today: result.data } : p)));
    setTick((t) => t + 1);
    if (action === "in") {
      setQ("");
      searchRef.current?.focus();
    }
  };

  const s = today?.summary;

  return (
    <>
      <PageHeader title="Check-In Desk" crumbs={["Check-in desk"]} icon="checkin">
        <span className="tabular rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {clock.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {clock.toLocaleTimeString("en-GB")}
        </span>
      </PageHeader>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <InfoBox icon="students" tone="emerald" label="Students Present" value={s ? `${s.students.present} of ${s.students.active}` : "…"} progress={s?.students.active ? (s.students.present / s.students.active) * 100 : 0} />
        <InfoBox icon="clock" tone="gold" label="Arrived Late" value={s ? s.students.late + s.staff.late : "…"} note="Students and staff" />
        <InfoBox icon="staff" tone="blue" label="Staff on Site" value={s ? `${s.staff.present} of ${s.staff.active}` : "…"} progress={s?.staff.active ? (s.staff.present / s.staff.active) * 100 : 0} />
        <InfoBox icon="logout" tone="slate" label="Checked Out" value={s ? s.checkedOut : "…"} note="Left for the day" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-5">
        <Card title="Find a Student or Staff Member" icon="search" accent="emerald" className="xl:col-span-2">
          <div className="relative">
            <AdminIcon name="search" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              autoFocus
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, name, phone or CNIC"
              aria-label="Find a person"
              className={`${inputClass} h-12 pl-10 text-base`}
            />
            {searching && <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-700" />}
          </div>
          <ul className="mt-4 grid gap-2.5">
            {q.trim().length >= 2 && !searching && results.length === 0 && <li><EmptyState icon="search" title="Nobody Found">Check the spelling, or register the student first.</EmptyState></li>}
            {results.map((p) => {
              const inDone = Boolean(p.today?.checkInAt);
              const outDone = Boolean(p.today?.checkOutAt);
              const blocked = p.personType === "student" ? p.status !== "active" : p.status === "inactive";
              return (
                <li key={`${p.personType}-${p.id}`} className="admin-pop rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${p.personType === "student" ? "bg-emerald-50 text-emerald-800" : "bg-cyber-50 text-cyber-700"}`}>{initials(p.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono font-semibold">{p.code}</span>
                        <Badge value={p.personType} />
                        {p.detail && <span className="capitalize">{p.detail}</span>}
                        {blocked && <Badge value={p.status} />}
                      </p>
                      {p.today && <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">Today <Badge value={p.today.status} /> in {time(p.today.checkInAt) || "—"}, out {time(p.today.checkOutAt) || "—"}</p>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Btn variant="primary" icon="login" disabled={inDone || blocked || busyId !== ""} onClick={() => act(p, "in")}>{busyId === `${p.id}-in` ? "Saving…" : inDone ? "Checked In" : "Check In"}</Btn>
                    <Btn icon="logoutIcon" disabled={!inDone || outDone || busyId !== ""} onClick={() => act(p, "out")}>{busyId === `${p.id}-out` ? "Saving…" : outDone ? "Checked Out" : "Check Out"}</Btn>
                  </div>
                </li>
              );
            })}
          </ul>
          {q.trim().length < 2 && (
            <div className="mt-2 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Type at least two characters. Lateness is worked out from the person's shift: a student's shift comes from their paid batch, and a staff member's from their profile.
            </div>
          )}
        </Card>

        <Card title={`Today's Log${today ? `, ${dayLabel(today.date)}` : ""}`} icon="attendance" className="xl:col-span-3" bodyClassName="p-0" tools={<><Btn size="sm" icon="refresh" onClick={() => setTick((t) => t + 1)}>Refresh</Btn><Link to="/admin/attendance" className="text-sm font-semibold text-emerald-700 hover:underline">Full Report</Link></>}>
          <div className="max-h-[34rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-2.5">Person</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">In</th><th className="px-4 py-2.5">Out</th><th className="px-4 py-2.5">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!today && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400"><Spinner /></td></tr>}
                {today?.records.length === 0 && <tr><td colSpan={5}><EmptyState icon="checkin" title="No Check-Ins Yet Today" /></td></tr>}
                {today?.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5"><p className="font-semibold text-slate-800">{r.personName}</p><p className="font-mono text-[11px] text-slate-500">{r.personCode}{r.courseCode ? ` · ${r.courseCode}` : ""}</p></td>
                    <td className="px-4 py-2.5"><Badge value={r.personType} /></td>
                    <td className="tabular px-4 py-2.5 text-slate-600">{time(r.checkInAt) || "—"}</td>
                    <td className="tabular px-4 py-2.5 text-slate-600">{time(r.checkOutAt) || "—"}</td>
                    <td className="px-4 py-2.5"><Badge value={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
