import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../Api/client";

const usd = (cents) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
const date = (value) => (value ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "");
const statusStyle = {
  paid: "bg-emerald-50 text-emerald-800",
  pending_payment: "bg-gold-50 text-gold-600",
  expired: "bg-cream-200 text-muted",
  cancelled: "bg-red-50 text-red-700",
  new: "bg-gold-50 text-gold-600",
  answered: "bg-emerald-50 text-emerald-800",
};
const statusLabel = { paid: "Paid", pending_payment: "Awaiting payment", expired: "Expired", cancelled: "Cancelled", new: "New", answered: "Answered" };

function Badge({ value }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[value] || "bg-cream-200 text-body"}`}>{statusLabel[value] || value}</span>;
}

function Notice({ tone = "error", children }) {
  if (!children) return null;
  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}>{children}</p>;
}

function Login({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const result = await api("/admin/login", { method: "POST", body: { email, password } });
    setBusy(false);
    if (!result.ok) {
      setError(result.message || "Sign-in failed.");
      return;
    }
    onSignedIn(result.data);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-emerald-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/brand/crest-768.png" alt="" className="h-10 w-10 object-contain" />
          <div>
            <p className="font-display text-lg font-bold text-ink">PSCDB admin</p>
            <p className="text-xs text-muted">Authorised staff only</p>
          </div>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-ink">Sign in</h1>
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="text-sm font-semibold text-ink">Email</label>
            <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-semibold text-ink">Password</label>
            <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <Notice>{error}</Notice>
          <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        </div>
      </form>
    </main>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api("/admin/overview").then((result) => result.ok && setData(result.data));
  }, []);
  if (!data) return <div className="skeleton h-40 w-full" aria-busy="true" />;

  const stat = (status) => data.byStatus.find((item) => item._id === status) || { count: 0, totalUsdCents: 0 };
  const cards = [
    ["Paid enrolments", stat("paid").count],
    ["Revenue received", usd(stat("paid").totalUsdCents)],
    ["Awaiting payment", stat("pending_payment").count],
    ["Expired or cancelled", stat("expired").count + stat("cancelled").count],
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-white p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="tabular mt-2 font-display text-3xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="seats-heading" className="rounded-xl border border-line bg-white">
        <h2 id="seats-heading" className="border-b border-line px-5 py-4 font-display text-lg font-bold text-ink">Seats by course</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-muted"><tr><th className="px-5 py-3">Course</th><th className="px-5 py-3">Morning</th><th className="px-5 py-3">Evening</th></tr></thead>
            <tbody className="divide-y divide-line">
              {data.courses.map((course) => (
                <tr key={course.code}>
                  <td className="px-5 py-3"><span className="font-mono text-xs font-semibold text-emerald-700">{course.code}</span> <span className="text-ink">{course.title}</span></td>
                  {["morning", "evening"].map((id) => {
                    const batch = course.batches.find((item) => item.id === id);
                    return <td key={id} className="tabular px-5 py-3 text-body">{batch ? `${batch.capacity - batch.seatsAvailable} booked, ${batch.seatsAvailable} free` : "Not offered"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="recent-heading" className="rounded-xl border border-line bg-white">
        <h2 id="recent-heading" className="border-b border-line px-5 py-4 font-display text-lg font-bold text-ink">Recent enrolments</h2>
        {data.recent.length === 0 ? <p className="px-5 py-6 text-sm text-muted">No enrolments yet.</p> : (
          <ul className="divide-y divide-line">
            {data.recent.map((item) => (
              <li key={item.reference} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span><span className="font-mono text-xs">{item.reference}</span> · {item.student.fullName} · {item.courseCode}</span>
                <Badge value={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Enrolments() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api(`/admin/enrolments${status ? `?status=${status}` : ""}`).then((result) => setItems(result.ok ? result.data : []));
  }, [status]);

  const term = query.trim().toLowerCase();
  const visible = (items || []).filter((item) => !term || [item.reference, item.student.fullName, item.student.email, item.courseCode].some((value) => value.toLowerCase().includes(term)));

  const exportCsv = () => {
    const header = ["Reference", "Status", "Course", "Batch", "Name", "Email", "Phone", "Country", "CNIC or passport", "Qualification", "Total (USD)", "Created"];
    const rows = visible.map((item) => [item.reference, statusLabel[item.status], item.courseCode, item.batchId, item.student.fullName, item.student.email, item.student.phone, item.student.country, item.student.identityNumber, item.student.education, (item.totalUsdCents / 100).toFixed(2), date(item.createdAt)]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "pscdb-enrolments.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[["", "All"], ["paid", "Paid"], ["pending_payment", "Awaiting payment"], ["expired", "Expired"], ["cancelled", "Cancelled"]].map(([value, label]) => (
            <button key={label} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${status === value ? "bg-emerald-950 text-white" : "bg-white text-body ring-1 ring-line"}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="enrolment-search" className="sr-only">Search enrolments</label>
          <input id="enrolment-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reference, name, email or course" className="h-10 w-64 rounded-lg border border-line px-3 text-sm outline-none focus:border-emerald-600" />
          <button type="button" onClick={exportCsv} disabled={!visible.length} className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-emerald-700 disabled:opacity-50">Export CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        {items === null ? <div className="skeleton m-5 h-24" /> : visible.length === 0 ? <p className="px-5 py-8 text-sm text-muted">No enrolments match.</p> : (
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>{["Reference", "Student", "Course", "Batch", "Total", "Status", "Created"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((item) => (
                <tr key={item.reference} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs">{item.reference}</td>
                  <td className="px-4 py-3"><span className="block font-semibold text-ink">{item.student.fullName}</span><span className="block text-xs text-muted">{item.student.email} · {item.student.phone}</span><span className="block text-xs text-muted">{item.student.country} · {item.student.identityNumber}</span></td>
                  <td className="px-4 py-3">{item.courseCode}</td>
                  <td className="px-4 py-3 capitalize">{item.batchId}</td>
                  <td className="tabular px-4 py-3">{usd(item.totalUsdCents)}</td>
                  <td className="px-4 py-3"><Badge value={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted">{date(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CourseEditor({ course, canEdit, onSaved }) {
  const [form, setForm] = useState({
    feeUsd: course.feeUsdCents / 100,
    examFeeUsd: course.examFeeUsdCents / 100,
    examIncludedByInstitute: course.examIncludedByInstitute,
    published: course.published,
    batches: course.batches.map(({ id, label, timing, capacity, seatsAvailable }) => ({ id, label, timing, capacity, seatsAvailable })),
  });
  const [message, setMessage] = useState({ tone: "", text: "" });
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage({ tone: "", text: "" });
    const result = await api(`/admin/courses/${course.code}`, {
      method: "PATCH",
      body: {
        feeUsd: Number(form.feeUsd),
        examFeeUsd: Number(form.examFeeUsd),
        examIncludedByInstitute: form.examIncludedByInstitute,
        published: form.published,
        batches: form.batches.map(({ id, timing, capacity }) => ({ id, timing, capacity: Number(capacity) })),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message || "The course could not be saved." });
      return;
    }
    setMessage({ tone: "ok", text: "Saved. The website now shows these values." });
    onSaved();
  };

  const input = "mt-1 h-10 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-emerald-600 disabled:bg-cream-100";

  return (
    <form onSubmit={save} className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-ink"><span className="font-mono text-sm text-emerald-700">{course.code}</span> {course.title}</h3>
        <label className="flex items-center gap-2 text-sm text-body">
          <input type="checkbox" disabled={!canEdit} checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-4 w-4 accent-emerald-700" />
          Shown on the website
        </label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold text-ink">Course fee (USD)
          <input type="number" min="0" step="0.01" required disabled={!canEdit} value={form.feeUsd} onChange={(event) => setForm({ ...form, feeUsd: event.target.value })} className={input} />
        </label>
        <label className="text-sm font-semibold text-ink">Exam fee (USD)
          <input type="number" min="0" step="0.01" required disabled={!canEdit} value={form.examFeeUsd} onChange={(event) => setForm({ ...form, examFeeUsd: event.target.value })} className={input} />
        </label>
        <label className="flex items-center gap-3 self-end rounded-lg border border-line px-3 py-2 text-sm text-body">
          <input type="checkbox" role="switch" disabled={!canEdit} checked={form.examIncludedByInstitute} onChange={(event) => setForm({ ...form, examIncludedByInstitute: event.target.checked })} className="h-4 w-4 accent-emerald-700" />
          Institute pays the exam fee
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {form.batches.map((batch, index) => (
          <fieldset key={batch.id} className="rounded-lg border border-line p-4">
            <legend className="px-1 text-sm font-semibold text-ink">{batch.label} <span className="font-normal text-muted">({batch.capacity - batch.seatsAvailable} booked)</span></legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-ink">Timing
                <input type="text" maxLength={80} disabled={!canEdit} placeholder="For example 9:00 AM to 12:00 PM" value={batch.timing} onChange={(event) => setForm({ ...form, batches: form.batches.map((item, i) => (i === index ? { ...item, timing: event.target.value } : item)) })} className={input} />
              </label>
              <label className="text-xs font-semibold text-ink">Total seats
                <input type="number" min="0" max="1000" step="1" required disabled={!canEdit} value={batch.capacity} onChange={(event) => setForm({ ...form, batches: form.batches.map((item, i) => (i === index ? { ...item, capacity: event.target.value } : item)) })} className={input} />
              </label>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1"><Notice tone={message.tone === "ok" ? "ok" : "error"}>{message.text}</Notice></div>
        {canEdit && <button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>}
      </div>
    </form>
  );
}

function Courses({ canEdit }) {
  const [courses, setCourses] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    api("/admin/courses").then((result) => setCourses(result.ok ? result.data : []));
  }, [version]);
  if (!courses) return <div className="skeleton h-40" />;
  return (
    <div className="flex flex-col gap-5">
      {!canEdit && <Notice tone="ok">You can view courses. Only a superadmin can change fees, seats and timings.</Notice>}
      {courses.map((course) => <CourseEditor key={course.code} course={course} canEdit={canEdit} onSaved={() => setVersion((v) => v + 1)} />)}
    </div>
  );
}

function Enquiries() {
  const [items, setItems] = useState(null);
  const load = useCallback(() => api("/admin/enquiries").then((result) => setItems(result.ok ? result.data : [])), []);
  useEffect(() => {
    load();
  }, [load]);
  const mark = async (id, status) => {
    await api(`/admin/enquiries/${id}`, { method: "PATCH", body: { status } });
    load();
  };
  if (!items) return <div className="skeleton h-40" />;
  if (!items.length) return <p className="rounded-xl border border-line bg-white px-5 py-8 text-sm text-muted">No enquiries yet.</p>;
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item._id} className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm"><span className="font-semibold text-ink">{item.name}</span> · <a href={`mailto:${item.email}`} className="text-emerald-800 underline">{item.email}</a>{item.phone ? ` · ${item.phone}` : ""}</p>
            <div className="flex items-center gap-3"><Badge value={item.status} /><span className="text-xs text-muted">{date(item.createdAt)}</span></div>
          </div>
          <p className="mt-1 text-xs text-muted">Topic: {item.topic}{item.courseSlug ? ` · Course: ${item.courseSlug}` : ""}</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">{item.message}</p>
          <button type="button" onClick={() => mark(item._id, item.status === "new" ? "answered" : "new")} className="mt-3 text-sm font-semibold text-emerald-800 hover:underline">
            {item.status === "new" ? "Mark as answered" : "Mark as new"}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Settings({ canEdit }) {
  const [rate, setRate] = useState("");
  const [meta, setMeta] = useState(null);
  const [message, setMessage] = useState({ tone: "", text: "" });
  useEffect(() => {
    api("/admin/settings").then((result) => {
      if (result.ok) {
        setRate(String(result.data.pkrPerUsd));
        setMeta(result.data);
      }
    });
  }, []);
  const save = async (event) => {
    event.preventDefault();
    const result = await api("/admin/settings", { method: "PUT", body: { pkrPerUsd: Number(rate) } });
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message || "The rate could not be saved." });
      return;
    }
    setMeta(result.data);
    setMessage({ tone: "ok", text: "Saved. Rupee amounts on the website now use this rate." });
  };
  return (
    <form onSubmit={save} className="max-w-lg rounded-xl border border-line bg-white p-6">
      <h2 className="font-display text-lg font-bold text-ink">Exchange rate</h2>
      <p className="mt-1 text-sm text-muted">Fees are charged in US dollars. This rate is only used to show rupee amounts on the website.</p>
      <label htmlFor="rate" className="mt-5 block text-sm font-semibold text-ink">Pakistani rupees per US dollar</label>
      <input id="rate" type="number" min="1" step="0.01" required disabled={!canEdit} value={rate} onChange={(event) => setRate(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-emerald-600 disabled:bg-cream-100" />
      {meta?.updatedAt && <p className="mt-2 text-xs text-muted">Last updated {date(meta.updatedAt)}{meta.updatedBy ? ` by ${meta.updatedBy}` : ""}.</p>}
      <div className="mt-5 flex flex-col gap-3">
        <Notice tone={message.tone === "ok" ? "ok" : "error"}>{message.text}</Notice>
        {canEdit && <button type="submit" className="min-h-11 self-start rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Save rate</button>}
      </div>
    </form>
  );
}

const sections = [
  { path: "/admin", label: "Overview" },
  { path: "/admin/enrolments", label: "Enrolments" },
  { path: "/admin/courses", label: "Courses and fees" },
  { path: "/admin/enquiries", label: "Enquiries" },
  { path: "/admin/settings", label: "Settings" },
];

export default function AdminApp() {
  const [admin, setAdmin] = useState(undefined);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    document.title = "PSCDB admin";
    api("/admin/me").then((result) => setAdmin(result.ok ? result.data : null));
    return () => meta.remove();
  }, []);

  if (admin === undefined) return <main className="grid min-h-screen place-items-center bg-cream-100"><div className="skeleton h-10 w-40" /></main>;
  if (!admin) return <Login onSignedIn={setAdmin} />;

  const current = sections.find((item) => item.path === pathname) || sections[0];
  const canEdit = admin.role === "superadmin";
  const signOut = async () => {
    await api("/admin/logout", { method: "POST" });
    setAdmin(null);
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-emerald-950 text-white lg:min-h-screen">
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/brand/crest-768.png" alt="" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold">PSCDB admin</span>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {sections.map((item) => (
            <a key={item.path} href={item.path} onClick={(event) => { event.preventDefault(); navigate(item.path); }} aria-current={item.path === current.path ? "page" : undefined} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${item.path === current.path ? "bg-white/10 text-gold-300" : "text-white/75 hover:bg-white/5 hover:text-white"}`}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-5 py-4 sm:px-8">
          <h1 className="font-display text-xl font-bold text-ink">{current.label}</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{admin.name} · {admin.role === "superadmin" ? "Superadmin" : "Staff"}</span>
            <a href="/" className="font-semibold text-emerald-800 hover:underline">View website</a>
            <button type="button" onClick={signOut} className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:border-emerald-700">Sign out</button>
          </div>
        </header>
        <main className="p-5 sm:p-8">
          {current.path === "/admin" && <Overview />}
          {current.path === "/admin/enrolments" && <Enrolments />}
          {current.path === "/admin/courses" && <Courses canEdit={canEdit} />}
          {current.path === "/admin/enquiries" && <Enquiries />}
          {current.path === "/admin/settings" && <Settings canEdit={canEdit} />}
        </main>
      </div>
    </div>
  );
}
