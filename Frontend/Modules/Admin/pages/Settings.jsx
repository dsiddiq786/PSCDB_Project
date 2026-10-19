import { useEffect, useState } from "react";
import { api } from "../../Api/client";
import PageHeader from "../ui/PageHeader";
import { Badge, Btn, Card, Field, Spinner, inputClass } from "../ui/kit";
import { dateTime, label } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";

export default function Settings() {
  const { me, toast } = useAdmin();
  const [settings, setSettings] = useState(null);
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canEdit = hasRole(me, "superadmin");

  useEffect(() => {
    api("/admin/settings").then((r) => {
      if (!r.ok) return;
      setSettings(r.data);
      setRate(String(r.data?.pkrPerUsd ?? ""));
    });
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await api("/admin/settings", { method: "PUT", body: { pkrPerUsd: Number(rate) } });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setSettings(result.data);
    toast({ tone: "success", title: "Exchange rate updated", message: `The website now shows PKR ${result.data.pkrPerUsd} per US dollar.` });
  };

  return (
    <>
      <PageHeader title="Settings" crumbs={["Settings"]} icon="settings" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Currency" icon="money" accent="emerald">
          {!settings ? <Spinner /> : (
            <form onSubmit={save} className="grid gap-4">
              <p className="text-sm leading-6 text-slate-600">Fees are charged in US dollars. The website shows rupee amounts using this rate. Bookings keep the rate that applied when they were made.</p>
              <Field label="Rupees per US dollar" htmlFor="rate" error={error} hint={settings.updatedBy ? `Last changed by ${settings.updatedBy} on ${dateTime(settings.updatedAt)}` : undefined}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">PKR</span>
                    <input id="rate" type="number" min="1" max="100000" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} disabled={!canEdit} className={`${inputClass} pl-12`} />
                  </div>
                  {canEdit && <Btn variant="primary" type="submit" disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />}Save</Btn>}
                </div>
              </Field>
              {!canEdit && <p className="text-xs text-slate-500">Only a superadmin can change the exchange rate.</p>}
            </form>
          )}
        </Card>

        <Card title="Your account" icon="user" accent="blue">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-semibold text-slate-800">{me.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="text-slate-800">{me.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd><Badge value={me.role} /></dd></div>
          </dl>
          <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-700">What each role can do</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>{label("staff")}</strong>: check-ins, students and enquiries.</li>
              <li><strong>{label("manager")}</strong>: everything above, plus courses, batches, shifts, centres, staff and enrollments.</li>
              <li><strong>{label("superadmin")}</strong>: everything, including users, settings and the audit log.</li>
            </ul>
          </div>
        </Card>
      </div>
    </>
  );
}
