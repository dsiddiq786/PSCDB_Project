import { useState } from "react";
import { Container, PageHeader } from "./ui";
import { api } from "../Modules/Api/client";
import { useCatalogue } from "../Modules/Catalogue/catalogueContext";
import { centres, institute } from "../Modules/Config/institute";

const topics = [
  { value: "admission", label: "Admissions and enrollment" },
  { value: "programme", label: "Course information" },
  { value: "payment", label: "Fees and payments" },
  { value: "research", label: "Research collaboration" },
  { value: "partnership", label: "Employer or partner" },
  { value: "opportunity", label: "Careers" },
  { value: "other", label: "Something else" },
];

const address = centres[0].address;
const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function readParams() {
  if (typeof window === "undefined") return { topic: "admission", programme: "" };
  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic");
  return {
    topic: topics.some((item) => item.value === topic) ? topic : "admission",
    programme: params.get("programme") || "",
  };
}

function FieldError({ errors, name }) {
  return errors[name] ? <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-red-700">{errors[name]}</p> : null;
}

export default function ContactPage() {
  const { courses } = useCatalogue();
  const [initial] = useState(readParams);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: initial.topic, courseSlug: initial.programme, message: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [serverError, setServerError] = useState("");

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.phone.trim() && !/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number, or leave it empty.";
    if (form.message.trim().length < 10) next.message = "Write a message of at least 10 characters.";
    setErrors(next);
    if (Object.keys(next).length) document.getElementById(Object.keys(next)[0])?.focus();
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSending(true);
    const result = await api("/enquiries", { method: "POST", body: form });
    setSending(false);
    if (!result.ok) {
      if (result.field) setErrors({ [result.field]: result.message });
      setServerError(result.message || "Your message could not be sent. Please try again.");
      return;
    }
    setSent(result.message || "Thank you. Your message has been sent.");
  };

  const fieldClass = (name) =>
    `mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:ring-2 ${errors[name] ? "border-red-500 focus:ring-red-100" : "border-line focus:border-emerald-600 focus:ring-emerald-100"}`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contact" }]}
        eyebrow="Contact"
        title="Talk to our team"
        intro="Ask about admissions, a course, a payment or a partnership. Our team replies by email."
      />

      <section aria-label="Contact details and form" className="bg-cream-100 py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Email</h2>
              <a href={`mailto:${institute.email}`} className="mt-2 block font-display text-lg font-bold text-ink hover:text-emerald-800">{institute.email}</a>
            </div>
            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Office</h2>
              <p className="mt-2 text-sm leading-7 text-body">{address}</p>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-emerald-800 hover:underline">Open in Google Maps →</a>
            </div>
            <div className="rounded-xl border border-line bg-white p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Already enrolled?</h2>
              <p className="mt-2 text-sm leading-7 text-body">Include your booking reference in your message so we can find your enrollment quickly.</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
            {sent ? (
              <div role="status" className="py-6">
                <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-xl font-bold text-emerald-700">✓</span>
                <h2 className="mt-5 font-display text-2xl font-bold text-ink">Message sent</h2>
                <p className="mt-2 text-sm leading-7 text-muted">{sent}</p>
                <a href="/courses" className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Browse courses</a>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h2 className="font-display text-xl font-bold text-ink">Send us a message</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="text-sm font-semibold text-ink">Full name</label>
                    <input id="name" autoComplete="name" value={form.name} onChange={update("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} className={fieldClass("name")} />
                    <FieldError errors={errors} name="name" />
                  </div>
                  <div>
                    <label htmlFor="email" className="text-sm font-semibold text-ink">Email address</label>
                    <input id="email" type="email" autoComplete="email" value={form.email} onChange={update("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={fieldClass("email")} />
                    <FieldError errors={errors} name="email" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="text-sm font-semibold text-ink">Phone <span className="font-normal text-muted">(optional)</span></label>
                    <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} className={fieldClass("phone")} />
                    <FieldError errors={errors} name="phone" />
                  </div>
                  <div>
                    <label htmlFor="topic" className="text-sm font-semibold text-ink">Topic</label>
                    <select id="topic" value={form.topic} onChange={update("topic")} className={fieldClass("topic")}>
                      {topics.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  {["admission", "programme", "payment"].includes(form.topic) && (
                    <div className="sm:col-span-2">
                      <label htmlFor="courseSlug" className="text-sm font-semibold text-ink">Course <span className="font-normal text-muted">(optional)</span></label>
                      <select id="courseSlug" value={form.courseSlug} onChange={update("courseSlug")} className={fieldClass("courseSlug")}>
                        <option value="">Not about a specific course</option>
                        {courses.map((course) => <option key={course.slug} value={course.slug}>{course.code} {course.title}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="text-sm font-semibold text-ink">Message</label>
                    <textarea id="message" rows={6} value={form.message} onChange={update("message")} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} className={`${fieldClass("message")} resize-y`} />
                    <FieldError errors={errors} name="message" />
                  </div>
                </div>
                {serverError && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}
                <div className="mt-7 flex justify-end">
                  <button type="submit" disabled={sending} className="inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
