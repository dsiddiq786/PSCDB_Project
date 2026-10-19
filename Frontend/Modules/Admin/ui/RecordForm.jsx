import { useEffect, useMemo, useState } from "react";
import { api } from "../../Api/client";
import { Btn, Field, Modal, Spinner, Switch, inputClass } from "./kit";
import { useAdmin } from "../lib/adminContext";

const DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];

const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function initialValue(field, row) {
  const value = row?.[field.name];
  if (row && value !== undefined && value !== null) {
    if (field.type === "date") return String(value).slice(0, 10);
    if (field.type === "datetime") return toLocalInput(value);
    if (field.type === "password") return "";
    return value;
  }
  if (field.default !== undefined) return field.default;
  if (field.type === "checkbox") return false;
  if (field.type === "days") return [];
  return "";
}

function outputValue(field, value) {
  if (field.type === "number" || field.type === "money") return value === "" ? null : Number(value);
  if (field.type === "datetime") return value ? new Date(value).toISOString() : null;
  return value;
}

/* Searchable student picker that queries the server as you type. */
function StudentPicker({ id, value, onChange, invalid }) {
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api(`/admin/lookups?students=${encodeURIComponent(term)}`, { signal: controller.signal }).then((r) => r.ok && setOptions(r.data.students));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  return (
    <div className={`overflow-hidden rounded-md border ${invalid ? "border-red-400" : "border-slate-300"}`}>
      <input id={id} type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, ID, email or phone" className="h-9 w-full border-b border-slate-200 px-3 text-sm outline-none focus:bg-emerald-50/40" aria-label="Search students" />
      <div role="radiogroup" aria-label="Students" className="max-h-48 overflow-y-auto">
        {options.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">No students found.</p>}
        {options.map((o) => (
          <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm ${value === o.value ? "bg-emerald-50 text-emerald-900" : "text-slate-700 hover:bg-slate-50"}`}>
            <input type="radio" name={`${id}-choice`} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="h-4 w-4 accent-emerald-700" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function RecordForm({ open, title, fields, row, endpoint, method, onClose, onSaved, transform, submitLabel }) {
  const { lookups, toast } = useAdmin();
  const editing = Boolean(row);
  const shown = useMemo(() => fields.filter((f) => (editing ? !f.createOnly : !f.editOnly)), [fields, editing]);
  const [values, setValues] = useState(() => Object.fromEntries(shown.map((f) => [f.name, initialValue(f, row)])));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const set = (name, value) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // Clear fields that depend on this one, such as a batch when the course changes.
      for (const f of shown) if (f.dependsOn === name) next[f.name] = "";
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const optionsFor = (field) => {
    if (field.options) return typeof field.options === "function" ? field.options(values, lookups) : field.options;
    if (field.lookup) return (lookups?.[field.lookup] || []).filter((o) => o.active !== false || o.value === values[field.name]);
    return [];
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    for (const f of shown) {
      if (f.showIf && !f.showIf(values)) continue;
      const value = values[f.name];
      if (f.required && (value === "" || value === null || (Array.isArray(value) && !value.length))) next[f.name] = `${f.label} is required.`;
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const body = {};
    for (const f of shown) {
      if (f.type === "hidden" || (f.showIf && !f.showIf(values))) continue;
      if (f.type === "password" && !values[f.name]) continue;
      body[f.name] = outputValue(f, values[f.name]);
    }
    setBusy(true);
    setFormError("");
    const result = await api(editing ? `${endpoint}/${row.id}` : endpoint, { method: method || (editing ? "PATCH" : "POST"), body: transform ? transform(body, row) : body });
    setBusy(false);
    if (!result.ok) {
      if (result.field && shown.some((f) => f.name === result.field)) setErrors({ [result.field]: result.message });
      else setFormError(result.message || "Could not save. Please try again.");
      return;
    }
    toast({ tone: "success", title: editing ? "Changes saved" : "Record created" });
    onSaved?.(result.data);
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" type="submit" form="record-form" disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />}{submitLabel || (editing ? "Save Changes" : "Create")}</Btn></>}
    >
      <form id="record-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {formError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</p>}
        {shown.map((f) => {
          if (f.type === "hidden" || (f.showIf && !f.showIf(values))) return null;
          const id = `field-${f.name}`;
          const value = values[f.name];
          const invalid = Boolean(errors[f.name]);
          const common = { id, "aria-invalid": invalid, className: inputClass, disabled: f.disabledOnEdit && editing };
          let control;
          switch (f.type) {
            case "textarea":
              control = <textarea {...common} rows={f.rows || 3} value={value} onChange={(e) => set(f.name, e.target.value)} className={`${inputClass} h-auto py-2`} maxLength={f.max} />;
              break;
            case "select": {
              const options = optionsFor(f);
              control = (
                <select {...common} value={value} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">{f.placeholder || "Select…"}</option>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              );
              break;
            }
            case "multiselect": {
              const options = optionsFor(f);
              const list = Array.isArray(value) ? value : [];
              control = (
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <label key={o.value} className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${list.includes(o.value) ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-300 text-slate-600"}`}>
                      <input type="checkbox" className="h-4 w-4 accent-emerald-700" checked={list.includes(o.value)} onChange={() => set(f.name, list.includes(o.value) ? list.filter((v) => v !== o.value) : [...list, o.value])} />
                      {o.label}
                    </label>
                  ))}
                </div>
              );
              break;
            }
            case "days": {
              const list = Array.isArray(value) ? value : [];
              control = (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={f.label}>
                  {DAYS.map(([day, text]) => (
                    <button key={day} type="button" aria-pressed={list.includes(day)} onClick={() => set(f.name, list.includes(day) ? list.filter((d) => d !== day) : [...list, day])} className={`h-9 w-12 rounded-md text-sm font-semibold transition-colors ${list.includes(day) ? "bg-emerald-700 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                      {text}
                    </button>
                  ))}
                </div>
              );
              break;
            }
            case "checkbox":
              control = <div className="flex h-9 items-center"><Switch id={id} checked={value} onChange={(v) => set(f.name, v)} label={f.switchLabel || (value ? "Yes" : "No")} /></div>;
              break;
            case "student":
              control = <StudentPicker id={id} value={value} onChange={(v) => set(f.name, v)} invalid={invalid} />;
              break;
            default: {
              const type = { money: "number", datetime: "datetime-local", phone: "tel" }[f.type] || f.type || "text";
              control = (
                <div className="relative">
                  {f.type === "money" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>}
                  <input
                    {...common}
                    type={type}
                    value={value ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step || (f.type === "money" ? "0.01" : undefined)}
                    autoComplete={f.type === "password" ? "new-password" : "off"}
                    className={`${inputClass} ${f.type === "money" ? "pl-6" : ""}`}
                  />
                </div>
              );
            }
          }
          return (
            <Field key={f.name} label={f.label} htmlFor={id} required={f.required && !(f.type === "password" && editing)} hint={editing && f.editHint ? f.editHint : f.hint} error={errors[f.name]} className={f.wide || ["textarea", "days", "multiselect", "student"].includes(f.type) ? "sm:col-span-2" : ""}>
              {control}
            </Field>
          );
        })}
      </form>
    </Modal>
  );
}
