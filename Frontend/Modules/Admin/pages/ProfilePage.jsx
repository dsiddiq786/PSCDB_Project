import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, upload } from "../../Api/client";
import AdminIcon from "../ui/AdminIcon";
import Avatar from "../ui/Avatar";
import PageHeader from "../ui/PageHeader";
import RecordForm from "../ui/RecordForm";
import { Badge, Btn, Card, EmptyState, Field, InfoBox, Spinner, inputClass } from "../ui/kit";
import { date, dateTime, dayLabel, label, time, usd } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";
import { resources } from "../lib/resources";

/* One profile page for every person in the system: the signed-in user ("me"),
   admin users, staff members and students. What it shows depends on the kind
   of record and on what the viewer's role allows. */

const KINDS = {
  me: { title: "My Profile", crumbs: ["My Profile"], endpoint: "/admin/profile", photoRole: "staff" },
  users: { title: "User Profile", list: "/admin/users", listLabel: "Users and Roles", endpoint: "/admin/users", photoRole: "superadmin", editRole: "superadmin" },
  staff: { title: "Staff Profile", list: "/admin/staff", listLabel: "Staff", endpoint: "/admin/staff", photoRole: "manager", editRole: "manager" },
  students: { title: "Student Profile", list: "/admin/students", listLabel: "Students", endpoint: "/admin/students", photoRole: "staff", editRole: "staff" },
};

const ROLE_ACCESS = {
  superadmin: ["Everything in the admin panel", "Users, roles and sign-in access", "Settings, including the exchange rate", "The audit log"],
  manager: ["Courses, batches, shifts and centers", "Staff records and enrollments", "Students, check-ins and inquiries", "Reports and exports"],
  staff: ["The check-in desk", "Students and their attendance", "Inquiries", "Viewing courses, staff and enrollments"],
};

function Fact({ icon, label: text, children }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <AdminIcon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{text}</p>
        <p className="break-words text-sm text-slate-700">{children || <span className="text-slate-300">Not Given</span>}</p>
      </div>
    </li>
  );
}

function DetailGrid({ items }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {items.map(([term, value]) => (
        <div key={term} className="min-w-0 border-b border-slate-100 pb-3">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{term}</dt>
          <dd className="mt-1 break-words text-sm text-slate-800">{value || <span className="text-slate-300">Not Given</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

/* Header card: cover, picture with upload controls, name, badges and quick facts. */
function IdentityCard({ person, kind, canEditPhoto, onPhoto, busyPhoto, children }) {
  const input = useRef(null);
  const subtitle = kind === "students" ? person.studentId : kind === "staff" ? person.staffId : person.jobTitle || label(person.role);
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="texture-grid relative h-24" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 to-transparent" />
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-14 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar name={person.name} src={person.avatarUrl} size="xl" className="ring-4 ring-white shadow-md" />
            {busyPhoto && <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70 text-emerald-700"><Spinner className="h-6 w-6" /></span>}
            {canEditPhoto && (
              <>
                <button type="button" onClick={() => input.current?.click()} aria-label="Change profile picture" className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-emerald-700 text-white shadow-md ring-2 ring-white transition-colors hover:bg-emerald-800">
                  <AdminIcon name="edit" className="h-4 w-4" />
                </button>
                <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) onPhoto("upload", file); }} />
              </>
            )}
          </div>
          <h2 className="mt-3 font-display text-xl font-bold text-slate-800">{person.name}</h2>
          {subtitle && <p className={`text-sm ${kind === "students" || kind === "staff" ? "font-mono font-semibold text-slate-500" : "text-slate-500"}`}>{subtitle}</p>}
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {person.role && <Badge value={person.role} />}
            {person.status && <Badge value={person.status} />}
            {kind === "users" || kind === "me" ? <Badge value={person.active !== false}>{person.active !== false ? "Can Sign In" : "Access Disabled"}</Badge> : null}
          </div>
          {canEditPhoto && person.avatarUrl && (
            <button type="button" onClick={() => onPhoto("remove")} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Remove Picture</button>
          )}
          {canEditPhoto && <p className="mt-1 text-[11px] text-slate-400">JPG, PNG or WebP, up to 2 MB</p>}
        </div>
        <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{children}</ul>
      </div>
    </section>
  );
}

function PasswordCard() {
  const { toast } = useAdmin();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const rules = [
    [values.newPassword.length >= 12, "At least 12 characters"],
    [values.newPassword && values.newPassword !== values.currentPassword, "Different from your current password"],
    [values.newPassword && values.newPassword === values.confirm, "Both new passwords match"],
  ];
  const submit = async (event) => {
    event.preventDefault();
    if (values.newPassword !== values.confirm) return setErrors({ confirm: "The new passwords do not match." });
    setBusy(true);
    const r = await api("/admin/profile/password", { method: "POST", body: { currentPassword: values.currentPassword, newPassword: values.newPassword } });
    setBusy(false);
    if (!r.ok) return setErrors({ [r.field || "currentPassword"]: r.message });
    setValues({ currentPassword: "", newPassword: "", confirm: "" });
    toast({ tone: "success", title: "Password Changed", message: "Other devices have been signed out." });
  };
  return (
    <Card title="Change Password" icon="users" accent="gold">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_16rem]" noValidate>
        <div className="grid gap-4">
          <Field label="Current Password" htmlFor="pw-current" error={errors.currentPassword}>
            <input id="pw-current" type="password" autoComplete="current-password" value={values.currentPassword} onChange={set("currentPassword")} aria-invalid={Boolean(errors.currentPassword)} className={inputClass} />
          </Field>
          <Field label="New Password" htmlFor="pw-new" error={errors.newPassword}>
            <input id="pw-new" type="password" autoComplete="new-password" value={values.newPassword} onChange={set("newPassword")} aria-invalid={Boolean(errors.newPassword)} className={inputClass} />
          </Field>
          <Field label="Confirm New Password" htmlFor="pw-confirm" error={errors.confirm}>
            <input id="pw-confirm" type="password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} aria-invalid={Boolean(errors.confirm)} className={inputClass} />
          </Field>
          <div><Btn variant="primary" type="submit" disabled={busy || !rules.every(([ok]) => ok) || !values.currentPassword}>{busy && <Spinner className="h-3.5 w-3.5" />}Update Password</Btn></div>
        </div>
        <div className="rounded-md bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-700">Requirements</p>
          <ul className="mt-2 grid gap-1.5">
            {rules.map(([ok, text]) => (
              <li key={text} className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-slate-500"}`}>
                <AdminIcon name={ok ? "check" : "close"} className="h-3.5 w-3.5" strokeWidth={2.4} />{text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-500">A short phrase is easy to remember and hard to guess, for example three words joined with hyphens.</p>
        </div>
      </form>
    </Card>
  );
}

function MyDetailsCard({ profile, onSaved }) {
  const { toast } = useAdmin();
  const [values, setValues] = useState({ name: profile.name, phone: profile.phone, jobTitle: profile.jobTitle });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const changed = values.name !== profile.name || values.phone !== profile.phone || values.jobTitle !== profile.jobTitle;
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const r = await api("/admin/profile", { method: "PATCH", body: values });
    setBusy(false);
    if (!r.ok) return setErrors({ [r.field || "name"]: r.message });
    setErrors({});
    toast({ tone: "success", title: "Profile Updated" });
    onSaved(r.data);
  };
  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  return (
    <Card title="Personal Information" icon="user" accent="emerald">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Full Name" htmlFor="me-name" required error={errors.name}><input id="me-name" value={values.name} onChange={set("name")} aria-invalid={Boolean(errors.name)} className={inputClass} /></Field>
        <Field label="Job Title" htmlFor="me-title" error={errors.jobTitle}><input id="me-title" value={values.jobTitle} onChange={set("jobTitle")} placeholder="Admissions Officer" className={inputClass} /></Field>
        <Field label="Phone" htmlFor="me-phone" error={errors.phone}><input id="me-phone" type="tel" value={values.phone} onChange={set("phone")} placeholder="+92 300 0000000" aria-invalid={Boolean(errors.phone)} className={inputClass} /></Field>
        <Field label="Email" htmlFor="me-email" hint="Ask a superadmin to change your email or role."><input id="me-email" value={profile.email} disabled className={inputClass} /></Field>
        <div className="flex gap-2 sm:col-span-2">
          <Btn variant="primary" type="submit" disabled={busy || !changed}>{busy && <Spinner className="h-3.5 w-3.5" />}Save Changes</Btn>
          {changed && <Btn onClick={() => setValues({ name: profile.name, phone: profile.phone, jobTitle: profile.jobTitle })}>Discard</Btn>}
        </div>
      </form>
    </Card>
  );
}

function AttendanceCard({ attendance = [], summary = {} }) {
  return (
    <Card title="Attendance" icon="attendance" bodyClassName="p-0" tools={<span className="text-xs text-slate-500">Last 90 days: {summary.present || 0} present, {summary.late || 0} late, {summary.absent || 0} absent</span>}>
      {attendance.length === 0 ? <EmptyState icon="attendance" title="No Attendance Recorded Yet" /> : (
        <ul className="divide-y divide-slate-100">
          {attendance.slice(0, 15).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
              <span className="text-slate-700">{dayLabel(a.date)}</span>
              <span className="flex items-center gap-3"><span className="tabular text-xs text-slate-500">{time(a.checkInAt) || "—"} to {time(a.checkOutAt) || "—"}</span><Badge value={a.status} /></span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityCard({ activity = [] }) {
  return (
    <Card title="Recent Activity" icon="audit" bodyClassName="p-0">
      {activity.length === 0 ? <EmptyState icon="audit" title="No Activity Yet" /> : (
        <ol className="relative px-5 py-3">
          {activity.map((a) => (
            <li key={a.id} className="relative border-l border-slate-200 pb-4 pl-5 last:pb-1">
              <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-white ring-2 ring-emerald-600" />
              <p className="flex flex-wrap items-center gap-2 text-sm"><Badge value={a.action} /><span className="font-semibold text-slate-700">{label(a.resource)}</span><span className="text-xs text-slate-400">{dateTime(a.createdAt)}</span></p>
              {a.summary && <p className="mt-0.5 text-sm text-slate-500">{a.summary}</p>}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function AccessCard({ role }) {
  return (
    <Card title="Access and Permissions" icon="audit">
      <p className="text-sm text-slate-600">As a <strong className="text-slate-800">{label(role)}</strong>, this account can use:</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {(ROLE_ACCESS[role] || []).map((item) => (
          <li key={item} className="flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700"><AdminIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" strokeWidth={2.4} />{item}</li>
        ))}
      </ul>
    </Card>
  );
}

export default function ProfilePage({ kind }) {
  const { id } = useParams();
  const { me, toast, updateMe } = useAdmin();
  const config = KINDS[kind];
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [tick, setTick] = useState(0);
  const isMe = kind === "me" || (kind === "users" && id === me.id);

  useEffect(() => {
    const controller = new AbortController();
    api(kind === "me" ? config.endpoint : `${config.endpoint}/${id}`, { signal: controller.signal }).then((r) => {
      if (r.aborted) return;
      if (r.ok) setData(r.data);
      else setError(r.message || "This profile could not be loaded.");
    });
    return () => controller.abort();
  }, [kind, id, config.endpoint, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const photo = async (action, file) => {
    setBusyPhoto(true);
    const path = kind === "me" ? "/admin/profile/avatar" : `/admin/${kind}/${id}/avatar`;
    const r = action === "upload" ? await upload(path, "avatar", file) : await api(path, { method: "DELETE" });
    setBusyPhoto(false);
    if (!r.ok) return toast({ tone: "error", title: "Picture Not Saved", message: r.message });
    setData((d) => ({ ...d, avatarUrl: r.data.avatarUrl }));
    if (isMe) updateMe({ avatarUrl: r.data.avatarUrl });
    toast({ tone: "success", title: action === "upload" ? "Picture Updated" : "Picture Removed" });
  };

  if (error) {
    return (
      <>
        <PageHeader title={config.title} crumbs={[config.listLabel || config.title].filter(Boolean)} icon="user" />
        <Card><EmptyState icon="alert" title={error}>{config.list && <Link to={config.list} className="font-semibold text-emerald-700 hover:underline">Back to {config.listLabel}</Link>}</EmptyState></Card>
      </>
    );
  }
  if (!data) {
    return <div className="grid gap-5 lg:grid-cols-[20rem_1fr]"><div className="skeleton h-96 rounded-lg" /><div className="skeleton h-96 rounded-lg" /></div>;
  }

  const person = { ...data, name: data.name || data.fullName };
  const canEditPhoto = hasRole(me, config.photoRole) || isMe;
  const canEditRecord = config.editRole && hasRole(me, config.editRole) && !(kind === "users" && isMe);
  const tabs = [
    ["overview", "Overview"],
    ...(kind === "me" ? [["security", "Security"]] : []),
    ...(kind === "students" ? [["enrollments", `Enrollments (${data.enrolments?.length || 0})`]] : []),
    ...(kind === "students" || kind === "staff" ? [["attendance", "Attendance"]] : []),
    ...(kind === "me" || kind === "users" ? [["activity", "Activity"]] : []),
  ];
  const paid = (data.enrolments || []).filter((e) => e.status === "paid");
  const summary = data.attendanceSummary || {};
  const attended = (summary.present || 0) + (summary.late || 0);
  const tracked = attended + (summary.absent || 0);

  return (
    <>
      <PageHeader title={isMe && kind !== "me" ? "My Profile" : config.title} crumbs={[...(config.list ? [config.listLabel] : []), person.name]} icon="user">
        {config.list && <Link to={config.list} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><AdminIcon name="chevronLeft" className="h-4 w-4" />Back to {config.listLabel}</Link>}
        {canEditRecord && <Btn variant="primary" icon="edit" onClick={() => setEditing(true)}>Edit Details</Btn>}
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-20">
          <IdentityCard person={person} kind={kind === "me" ? "users" : kind} canEditPhoto={canEditPhoto} onPhoto={photo} busyPhoto={busyPhoto}>
            <Fact icon="enquiries" label="Email">{person.email && <a href={`mailto:${person.email}`} className="hover:text-emerald-700 hover:underline">{person.email}</a>}</Fact>
            <Fact icon="checkin" label="Phone">{person.phone}</Fact>
            {kind === "students" && <Fact icon="audit" label="CNIC or Passport">{person.identityNumber}</Fact>}
            {kind === "staff" && <Fact icon="shifts" label="Shift">{person.shift && label(person.shift)}</Fact>}
            {(kind === "me" || kind === "users") && <Fact icon="login" label="Last Sign-In">{dateTime(person.lastLoginAt)}</Fact>}
            <Fact icon="attendance" label={kind === "staff" ? "Joined" : "Member Since"}>{date(kind === "staff" ? person.joinedOn || person.createdAt : person.createdAt)}</Fact>
          </IdentityCard>
        </div>

        <div className="grid min-w-0 gap-5">
          {(kind === "students" || kind === "staff") && (
            <div className="grid gap-4 sm:grid-cols-3">
              {kind === "students" && <InfoBox icon="enrolments" tone="emerald" label="Enrollments" value={`${paid.length} paid`} note={`${data.enrolments?.length || 0} in total`} />}
              {kind === "students" && <InfoBox icon="money" tone="gold" label="Fees Paid" value={usd(paid.reduce((s, e) => s + e.totalUsd, 0))} note="All paid enrollments" />}
              {kind === "staff" && <InfoBox icon="staff" tone="emerald" label="Role" value={label(person.role)} note={label(person.department)} />}
              {kind === "staff" && <InfoBox icon="users" tone="gold" label="Admin Access" value={data.account ? label(data.account.role) : "None"} note={data.account?.lastLoginAt ? `Last sign-in ${date(data.account.lastLoginAt)}` : "No sign-in account"} />}
              <InfoBox icon="attendance" tone="blue" label="Attendance, 90 Days" value={tracked ? `${Math.round((attended / tracked) * 100)}%` : "No Records"} progress={tracked ? (attended / tracked) * 100 : 0} note={`${summary.late || 0} late, ${summary.absent || 0} absent`} />
            </div>
          )}

          {tabs.length > 1 && (
            <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              {tabs.map(([key, text]) => (
                <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`h-9 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors ${tab === key ? "bg-emerald-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
                  {text}
                </button>
              ))}
            </div>
          )}

          {tab === "overview" && (
            <>
              {kind === "me" ? (
                <MyDetailsCard key={`${data.name}-${data.phone}-${data.jobTitle}`} profile={data} onSaved={(next) => { setData(next); updateMe({ name: next.name, jobTitle: next.jobTitle }); }} />
              ) : (
                <Card title="Personal Information" icon="user" accent="emerald">
                  <DetailGrid
                    items={
                      kind === "students"
                        ? [["Full Name", person.fullName], ["Student ID", person.studentId], ["Email", person.email], ["Phone", person.phone], ["CNIC or Passport", person.identityNumber], ["Country", person.country], ["Highest Qualification", person.education], ["Registered Through", label(person.source)], ["Status", <Badge key="s" value={person.status} />], ["Registered On", date(person.createdAt)]]
                        : kind === "staff"
                          ? [["Full Name", person.fullName], ["Staff ID", person.staffId], ["Email", person.email], ["Phone", person.phone], ["CNIC", person.identityNumber], ["Role", label(person.role)], ["Department", label(person.department)], ["Shift", person.shift && label(person.shift)], ["Center", person.centre && label(person.centre)], ["Joined On", date(person.joinedOn)], ["Status", <Badge key="s" value={person.status} />]]
                          : [["Full Name", person.name], ["Email", person.email], ["Job Title", person.jobTitle], ["Phone", person.phone], ["Role", <Badge key="r" value={person.role} />], ["Last Sign-In", dateTime(person.lastLoginAt)], ["Account Created", date(person.createdAt)]]
                    }
                  />
                  {person.notes && <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700"><p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes</p><p className="whitespace-pre-wrap">{person.notes}</p></div>}
                </Card>
              )}
              {(kind === "me" || kind === "users") && <AccessCard role={person.role} />}
              {data.staff && (
                <Card title="Staff Record" icon="staff">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600"><span className="font-mono font-semibold text-slate-700">{data.staff.staffId}</span> · {label(data.staff.role)} · {label(data.staff.department)}{data.staff.shift ? ` · ${label(data.staff.shift)} Shift` : ""}</p>
                    <Link to={`/admin/staff/${data.staff.id}`} className="text-sm font-semibold text-emerald-700 hover:underline">Open Staff Profile</Link>
                  </div>
                </Card>
              )}
            </>
          )}

          {tab === "security" && kind === "me" && <PasswordCard />}

          {tab === "enrollments" && (
            <Card title="Enrollments" icon="enrolments" bodyClassName="p-0">
              {(data.enrolments || []).length === 0 ? <EmptyState icon="enrolments" title="No Enrollments Yet" /> : (
                <ul className="divide-y divide-slate-100">
                  {data.enrolments.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-semibold text-slate-500">{e.reference}</p>
                        <p className="truncate text-sm font-semibold text-slate-800">{e.courseCode} {e.courseTitle}</p>
                        <p className="text-xs text-slate-500">{label(e.batchId)} Batch · {date(e.createdAt)}</p>
                      </div>
                      <div className="text-right"><p className="tabular text-sm font-semibold text-slate-800">{usd(e.totalUsd)}</p><Badge value={e.status} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === "attendance" && <AttendanceCard attendance={data.attendance} summary={summary} />}
          {tab === "activity" && <ActivityCard activity={data.activity} />}
        </div>
      </div>

      {editing && (
        <RecordForm
          open
          title={`Edit ${config.title.replace(" Profile", "")}`}
          fields={resources[kind].form}
          row={data}
          endpoint={config.endpoint}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); reload(); }}
        />
      )}
    </>
  );
}
