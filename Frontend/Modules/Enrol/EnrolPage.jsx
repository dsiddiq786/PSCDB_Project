import { useEffect, useMemo, useState } from "react";
import { Container } from "../../Components/ui";
import { api } from "../Api/client";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CodeTag, FeePanel, LabTag } from "../Catalogue/CourseParts";
import { centreById } from "../Config/institute";

const STEPS = ["Batch", "Your details", "Review and pay"];

const fields = [
  { name: "fullName", label: "Full Name", autoComplete: "name", type: "text", hint: "As it should appear on your certificate." },
  { name: "email", label: "Email Address", autoComplete: "email", type: "email" },
  { name: "phone", label: "Phone Number", autoComplete: "tel", type: "tel", hint: "Include the country code, for example +92." },
  { name: "country", label: "Country of Residence", autoComplete: "country-name", type: "text", list: "countries" },
  { name: "identityNumber", label: "CNIC or Passport Number", autoComplete: "off", type: "text", hint: "Pakistani students enter their CNIC. International students enter their passport number." },
  { name: "education", label: "Highest Qualification", autoComplete: "off", type: "text", hint: "For example: BS Computer Science." },
];

const countries = ["Pakistan", "United Arab Emirates", "Saudi Arabia", "Qatar", "Oman", "United Kingdom", "United States", "Canada", "Afghanistan", "Bangladesh", "China", "Turkey", "Malaysia"];

const validators = {
  fullName: (v) => /^[\p{L}][\p{L} .'-]{1,99}$/u.test(v) || "Enter your full name.",
  email: (v) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v) || "Enter a valid email address.",
  phone: (v) => /^\+?[0-9 ()-]{7,20}$/.test(v) || "Enter a valid phone number.",
  country: (v) => /^[\p{L} .'-]{2,60}$/u.test(v) || "Enter your country.",
  identityNumber: (v) => /^[A-Za-z0-9-]{5,30}$/.test(v) || "Enter a valid CNIC or passport number.",
  education: (v) => /^[\p{L}\p{N} .,'()&/-]{2,120}$/u.test(v) || "Enter your highest qualification.",
};

function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Enrollment progress">
      {STEPS.map((label, index) => {
        const state = index < step ? "done" : index === step ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${state === "todo" ? "bg-cream-200 text-muted" : "bg-emerald-700 text-white"} ${state === "done" ? "pop" : ""}`}>
              {state === "done" ? "✓" : index + 1}
            </span>
            <span className={`hidden sm:inline ${state === "current" ? "font-semibold text-ink" : "text-muted"}`}>{label}</span>
            {index < STEPS.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-line sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

export default function EnrolPage({ slug }) {
  const { findCourse, refresh } = useCatalogue();
  const course = findCourse(slug);
  const [step, setStep] = useState(0);
  const [batchId, setBatchId] = useState("");
  const [student, setStudent] = useState({ fullName: "", email: "", phone: "", country: "Pakistan", identityNumber: "", education: "" });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [booking, setBooking] = useState(null);
  const [notice, setNotice] = useState("");

  // A student who leaves Stripe Checkout returns here; release that held seat.
  useEffect(() => {
    const cancelled = new URLSearchParams(window.location.search).get("cancelled");
    if (!cancelled) return;
    api(`/enrolments/${encodeURIComponent(cancelled)}/cancel`, { method: "POST" }).then(() => {
      setNotice("Your payment was not completed, so your seat has been released. You can try again below.");
      refresh();
      window.history.replaceState(null, "", window.location.pathname);
    });
  }, [refresh]);

  const batch = useMemo(() => course?.batches.find((item) => item.id === batchId), [course, batchId]);

  if (!course) {
    return (
      <section className="bg-cream-100 py-24">
        <Container className="max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold text-ink">This Course Is Not Available</h1>
          <a href="/courses" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white">Browse Courses</a>
        </Container>
      </section>
    );
  }

  const validateDetails = () => {
    const next = {};
    for (const field of fields) {
      const result = validators[field.name](student[field.name].trim());
      if (result !== true) next[field.name] = result;
    }
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return false;
    }
    return true;
  };

  const submit = async () => {
    setServerError("");
    if (!consent) {
      setServerError("Please accept the enrollment terms to continue.");
      return;
    }
    setSubmitting(true);
    const result = await api("/enrolments", { method: "POST", body: { courseSlug: course.slug, batchId, consent, student } });
    setSubmitting(false);
    if (!result.ok) {
      if (result.field && result.field !== "consent") {
        setErrors({ [result.field]: result.message });
        setStep(1);
      }
      setServerError(result.message || "We could not complete your enrollment. Please try again.");
      if (result.status === 409) refresh();
      return;
    }
    if (result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    setBooking(result.data);
  };

  const completeTestPayment = async () => {
    setSubmitting(true);
    const result = await api(`/enrolments/${booking.reference}/simulate-payment`, { method: "POST" });
    setSubmitting(false);
    if (!result.ok) {
      setServerError(result.message || "The test payment could not be completed.");
      return;
    }
    window.location.href = `/enroll/confirmation?ref=${encodeURIComponent(booking.reference)}`;
  };

  const inputClass = (name) =>
    `mt-1.5 h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink outline-none transition focus:ring-2 ${errors[name] ? "border-red-500 focus:ring-red-100" : "border-line focus:border-emerald-600 focus:ring-emerald-100"}`;

  return (
    <section aria-labelledby="enrol-heading" className="min-h-[70vh] bg-cream-100 py-10 sm:py-14">
      <Container>
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><a href="/courses" className="hover:text-emerald-800">Courses</a></li>
            <li aria-hidden="true">/</li>
            <li><a href={`/courses/${course.slug}`} className="hover:text-emerald-800">{course.title}</a></li>
            <li aria-hidden="true">/</li>
            <li className="text-ink">Enroll</li>
          </ol>
        </nav>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 id="enrol-heading" className="font-display text-3xl font-extrabold text-ink">Enroll in {course.title}</h1>
          <Stepper step={booking ? 3 : step} />
        </div>

        {notice && <p role="status" className="mt-6 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-ink">{notice}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div key={booking ? "booked" : step} className="page-enter rounded-xl border border-line bg-white p-6 sm:p-8">
            {booking ? (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Your Seat Is Reserved</h2>
                <p className="mt-2 text-sm text-muted">
                  Booking reference <span className="font-mono font-semibold text-ink">{booking.reference}</span>. The seat is held for 30 minutes while payment is completed.
                </p>
                <div className="mt-6 rounded-lg border border-dashed border-gold-400 bg-gold-50 p-5">
                  <p className="text-sm font-semibold text-ink">Test Mode</p>
                  <p className="mt-1 text-sm leading-6 text-body">Online card payments are not connected on this server yet. Use the button below to complete a test payment and see the confirmation step.</p>
                  <button type="button" onClick={completeTestPayment} disabled={submitting} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    {submitting ? "Processing…" : "Complete test payment"}
                  </button>
                </div>
              </div>
            ) : step === 0 ? (
              <fieldset>
                <legend className="font-display text-xl font-bold text-ink">Choose Your Batch</legend>
                <p className="mt-1 text-sm text-muted">{course.batches.length === 1 ? "This batch is" : course.batches.length === 2 ? "Both batches are" : "All batches are"} taught on-site at {centreById(course.centre, course)?.name || "our center"}.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {course.batches.map((item) => {
                    const full = item.seatsAvailable <= 0;
                    return (
                      <label key={item.id} className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-5 transition-all duration-200 hover:-translate-y-0.5 ${full ? "cursor-not-allowed border-line opacity-60" : batchId === item.id ? "border-emerald-700 bg-emerald-50" : "border-line hover:border-emerald-300"}`}>
                        <input type="radio" name="batch" value={item.id} disabled={full} checked={batchId === item.id} onChange={() => setBatchId(item.id)} className="sr-only" />
                        <span className="font-display text-lg font-bold text-ink">{item.label}</span>
                        <span className="mt-1 text-sm text-muted">{item.timing || "Timing shared on enrollment"}</span>
                        <span className={`mt-4 text-sm font-semibold ${full ? "text-red-700" : "text-emerald-700"}`}>{full ? "Fully booked" : `${item.seatsAvailable} of ${item.capacity} seats available`}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-end">
                  <button type="button" disabled={!batch} onClick={() => setStep(1)} className="inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                    Continue
                  </button>
                </div>
              </fieldset>
            ) : step === 1 ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (validateDetails()) setStep(2);
                }}
              >
                <h2 className="font-display text-xl font-bold text-ink">Your Details</h2>
                <p className="mt-1 text-sm text-muted">We use these details to register you and to issue your certificate.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field.name} className={field.name === "identityNumber" || field.name === "education" ? "sm:col-span-2" : ""}>
                      <label htmlFor={field.name} className="text-sm font-semibold text-ink">{field.label}</label>
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        list={field.list}
                        autoComplete={field.autoComplete}
                        value={student[field.name]}
                        onChange={(event) => setStudent((current) => ({ ...current, [field.name]: event.target.value }))}
                        aria-invalid={Boolean(errors[field.name])}
                        aria-describedby={errors[field.name] ? `${field.name}-error` : field.hint ? `${field.name}-hint` : undefined}
                        className={inputClass(field.name)}
                      />
                      {errors[field.name] ? (
                        <p id={`${field.name}-error`} className="mt-1.5 text-xs font-medium text-red-700">{errors[field.name]}</p>
                      ) : (
                        field.hint && <p id={`${field.name}-hint`} className="mt-1.5 text-xs text-muted">{field.hint}</p>
                      )}
                    </div>
                  ))}
                  <datalist id="countries">{countries.map((country) => <option key={country} value={country} />)}</datalist>
                </div>
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => setStep(0)} className="inline-flex min-h-12 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Back</button>
                  <button type="submit" className="inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800">Review</button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Review Your Enrollment</h2>
                <dl className="mt-6 divide-y divide-line rounded-lg border border-line text-sm">
                  {[
                    ["Course", `${course.code} ${course.title}`],
                    ["Batch", batch?.label],
                    ["Center", centreById(course.centre, course)?.name],
                    ["Name", student.fullName],
                    ["Email", student.email],
                    ["Phone", student.phone],
                    ["Country", student.country],
                    ["CNIC or passport", student.identityNumber],
                    ["Qualification", student.education],
                  ].map(([term, value]) => (
                    <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-3">
                      <dt className="text-muted">{term}</dt>
                      <dd className="break-words font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <label className="mt-6 flex items-start gap-3 text-sm text-body">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
                  <span>
                    I confirm these details are correct, and I agree to the{" "}
                    <a href="/about#conduct" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline">code of conduct</a> and the{" "}
                    <a href="/fees" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline">fee and payment terms</a>.
                  </span>
                </label>
                {serverError && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex min-h-12 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Back</button>
                  <button type="button" onClick={submit} disabled={submitting} className="inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                    {submitting ? "Reserving your seat…" : "Reserve seat and pay"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-line bg-white p-6">
              <div className="flex items-center gap-2"><CodeTag code={course.code} /><LabTag lab={course.lab} /></div>
              <p className="mt-3 font-display text-lg font-bold text-ink">{course.title}</p>
              <p className="text-sm text-muted">{course.level} · {course.duration}{batch ? ` · ${batch.label}` : ""}</p>
              <div className="mt-4 border-t border-line pt-2"><FeePanel course={course} /></div>
            </div>
            <p className="mt-4 px-1 text-xs leading-5 text-muted">Payments are processed by Stripe. PSCDB never sees or stores your card details.</p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
