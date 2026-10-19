import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../Api/client";
import AdminIcon from "../ui/AdminIcon";
import PageHeader from "../ui/PageHeader";
import { Badge, Btn, Card, InfoBox, SmallBox } from "../ui/kit";
import { Donut, Progress, RevenueChart } from "../ui/charts";
import { dateTime, label, number, pkr, usd } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";

const compactUsd = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${Math.round(v)}`);

function Skeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-32 rounded-lg" />)}</div>
      <div className="grid gap-5 lg:grid-cols-3"><div className="skeleton h-80 rounded-lg lg:col-span-2" /><div className="skeleton h-80 rounded-lg" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { me } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api("/admin/dashboard", { signal: controller.signal }).then((r) => {
      if (r.aborted) return;
      if (r.ok) setData(r.data);
      else setError(r.message || "Could not load the dashboard.");
    });
    // Keep the numbers fresh while the dashboard is open.
    const timer = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [tick]);

  const k = data?.kpis;
  const fill = k?.seatsCapacity ? Math.round((k.seatsBooked / k.seatsCapacity) * 100) : 0;

  return (
    <>
      <PageHeader title="Dashboard" crumbs={["Dashboard"]} icon="dashboard">
        <Btn size="sm" icon="refresh" onClick={() => setTick((t) => t + 1)}>Refresh</Btn>
      </PageHeader>
      {error && <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!data ? <Skeleton /> : (
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SmallBox tone="emerald" icon="money" value={usd(k.revenueUsd)} label="Total Revenue" sub={`${usd(k.revenueMonthUsd)} this month · ${pkr(k.revenueUsd, k.pkrPerUsd)}`} href="/admin/enrolments" />
            <SmallBox tone="blue" icon="enrolments" value={number(k.paidEnrolments)} label="Paid Enrollments" sub={`${k.pendingEnrolments} awaiting payment`} href="/admin/enrolments" />
            <SmallBox tone="gold" icon="students" value={number(k.activeStudents)} label="Active Students" sub={`${number(k.students)} students in total`} href="/admin/students" />
            <SmallBox tone="slate" icon="checkin" value={number(k.presentToday)} label="Students Present Today" sub={`${k.lateToday} late · ${k.staffPresentToday} staff on site`} href="/admin/check-in" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <InfoBox icon="seat" tone="emerald" label="Seats Filled" value={`${number(k.seatsBooked)} of ${number(k.seatsCapacity)}`} progress={fill} note={`${fill}% of all batch seats`} />
            <InfoBox icon="staff" tone="blue" label="Active Staff" value={number(k.staffActive)} note={`${k.staffPresentToday} checked in today`} />
            <InfoBox icon="clock" tone="gold" label="Awaiting Payment" value={number(k.pendingEnrolments)} note="Seats are held for 30 minutes online" />
            <InfoBox icon="enquiries" tone="red" label="New Inquiries" value={number(k.newEnquiries)} note={k.newEnquiries ? "Waiting for a reply" : "All answered"} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Revenue, Last 30 Days" icon="money" accent="emerald" className="lg:col-span-2" tools={<span className="text-xs text-slate-500">Exchange rate PKR {k.pkrPerUsd} per USD</span>}>
              <RevenueChart data={data.series} formatMoney={compactUsd} />
            </Card>
            <Card title="Enrollments by Status" icon="enrolments" accent="blue">
              <Donut
                centreLabel="Bookings"
                segments={[
                  { label: "Paid", value: data.statusBreakdown.find((s) => s.status === "paid").count, color: "#128058" },
                  { label: "Awaiting Payment", value: data.statusBreakdown.find((s) => s.status === "pending_payment").count, color: "#c9a24a" },
                  { label: "Expired", value: data.statusBreakdown.find((s) => s.status === "expired").count, color: "#94a3b8" },
                  { label: "Canceled", value: data.statusBreakdown.find((s) => s.status === "cancelled").count, color: "#e11d48" },
                  ...(data.statusBreakdown.find((s) => s.status === "refund_due")?.count ? [{ label: "Refund Due", value: data.statusBreakdown.find((s) => s.status === "refund_due").count, color: "#7f1d1d" }] : []),
                ]}
              />
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Paid enrollments by lab</p>
                <Donut size={120} centreLabel="Paid" segments={[{ label: "AI Lab", value: data.labSplit.ai, color: "#128058" }, { label: "Cyber Lab", value: data.labSplit.cyber, color: "#1f5bd8" }]} />
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            <Card title="Seat Occupancy by Course" icon="seat" className="xl:col-span-3" bodyClassName="p-0" tools={hasRole(me, "manager") && <Link to="/admin/courses" className="text-sm font-semibold text-emerald-700 hover:underline">Manage Courses</Link>}>
              <ul className="divide-y divide-slate-100">
                {data.courses.map((c) => (
                  <li key={c.code} className="grid gap-3 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-center">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">{c.code}</span><Badge value={c.lab} />{!c.published && <Badge value="inactive">Hidden</Badge>}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.paid} paid · {usd(c.revenueUsd)}</p>
                    </div>
                    <div className="grid gap-2">
                      {c.batches.map((b) => (
                        <div key={b.id}>
                          <div className="mb-1 flex justify-between text-xs"><span className="text-slate-600">{b.label}</span><span className="tabular text-slate-500">{b.booked}/{b.capacity}</span></div>
                          <Progress value={b.booked} max={b.capacity} />
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Latest Enrollments" icon="enrolments" className="xl:col-span-2" bodyClassName="p-0" tools={<Link to="/admin/enrolments" className="text-sm font-semibold text-emerald-700 hover:underline">View All</Link>}>
              <ul className="divide-y divide-slate-100">
                {data.recent.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">No enrollments yet.</li>}
                {data.recent.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">{e.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{e.name}</p>
                      <p className="truncate text-xs text-slate-500">{e.courseCode} · {label(e.batchId)} · {dateTime(e.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-sm font-semibold text-slate-800">{usd(e.totalUsd)}</p>
                      <Badge value={e.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Quick Actions" icon="layers">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/admin/check-in", icon: "checkin", title: "Open the Check-In Desk", text: "Record arrivals and departures" },
                { to: "/admin/students?new=1", icon: "students", title: "Register a Student", text: "Add a walk-in student" },
                { to: "/admin/enrolments?new=1", icon: "enrolments", title: "Record an Enrollment", text: "For cash or bank payments", role: "manager" },
                { to: "/admin/attendance", icon: "attendance", title: "Attendance Report", text: "Filter, edit and export" },
              ].filter((a) => !a.role || hasRole(me, a.role)).map((a) => (
                <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:border-emerald-600/40 hover:bg-emerald-50/40">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-950 text-gold-300"><AdminIcon name={a.icon} /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800 group-hover:text-emerald-800">{a.title}</span>
                    <span className="block text-xs text-slate-500">{a.text}</span>
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
