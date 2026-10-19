import { useEffect, useState } from "react";
import { Container } from "../../Components/ui";
import { api } from "../Api/client";
import { formatUsd } from "../Catalogue/pricing";
import { institute } from "../Config/institute";

/* "morning" becomes "Morning Batch"; works for any shift added in the admin panel. */
const batchName = (id = "") => `${id.charAt(0).toUpperCase()}${id.slice(1).replaceAll("-", " ")} Batch`;

export default function ConfirmationPage() {
  const reference = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("ref") || "";
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(reference ? "" : "No booking reference was provided.");

  // Stripe confirms payment a few seconds after redirecting, so check again while it is pending.
  useEffect(() => {
    if (!reference) return undefined;
    let attempts = 0;
    let timer;
    const controller = new AbortController();

    const load = async () => {
      const result = await api(`/enrolments/${encodeURIComponent(reference)}`, { signal: controller.signal });
      if (result.aborted) return;
      if (!result.ok) {
        setError(result.message || "We could not find this booking.");
        return;
      }
      setBooking(result.data);
      attempts += 1;
      if (result.data.status === "pending_payment" && attempts < 20) timer = window.setTimeout(load, 3000);
    };

    load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [reference]);

  const paid = booking?.status === "paid";
  const pending = booking?.status === "pending_payment";

  return (
    <section aria-labelledby="confirmation-heading" className="min-h-[70vh] bg-cream-100 py-14">
      <Container className="max-w-2xl">
        <div className="rounded-xl border border-line bg-white p-7 sm:p-10">
          {error ? (
            <>
              <h1 id="confirmation-heading" className="font-display text-3xl font-bold text-ink">Booking Not Found</h1>
              <p className="mt-3 text-muted">{error}</p>
              <a href="/contact?topic=payment" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white">Contact Admissions</a>
            </>
          ) : !booking ? (
            <div aria-busy="true" aria-live="polite">
              <p className="sr-only">Loading Your Booking</p>
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton mt-4 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-5/6" />
            </div>
          ) : (
            <>
              <span key={booking.status} className={`pop grid h-14 w-14 place-items-center rounded-full text-2xl font-bold ${paid ? "bg-emerald-50 text-emerald-700" : "bg-gold-50 text-gold-600"}`} aria-hidden="true">
                {paid ? "✓" : "…"}
              </span>
              <h1 id="confirmation-heading" className="mt-5 font-display text-3xl font-extrabold text-ink">
                {paid ? "Your enrollment is confirmed" : pending ? "Confirming your payment" : "This booking is no longer active"}
              </h1>
              <p className="mt-3 text-base leading-7 text-muted" aria-live="polite">
                {paid
                  ? "Thank you. Your seat is booked. Keep your booking reference. Admissions will contact you with your timetable and joining instructions."
                  : pending
                    ? "We are waiting for confirmation from the payment provider. This usually takes a few seconds."
                    : "The payment was not completed in time, so the seat was released. You can enroll again at any time."}
              </p>

              <dl className="mt-8 divide-y divide-line rounded-lg border border-line text-sm">
                {[
                  ["Booking reference", <span key="ref" className="font-mono font-semibold">{booking.reference}</span>],
                  ["Course", `${booking.courseCode} ${booking.courseTitle}`],
                  ["Batch", batchName(booking.batchId)],
                  [paid ? "Amount paid" : "Amount due", `${formatUsd(booking.totalUsd)} (PKR ${new Intl.NumberFormat("en-PK").format(booking.totalPkr)})`],
                  ["Exam fee", booking.examIncludedByInstitute ? "Included by the institute" : "Included in the amount above"],
                ].map(([term, value]) => (
                  <div key={term} className="grid grid-cols-[10rem_1fr] gap-4 px-4 py-3">
                    <dt className="text-muted">{term}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                {paid && (
                  <a href={institute.lmsUrl} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Go to the Student Portal (LMS)</a>
                )}
                {paid && (
                  <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Print Confirmation</button>
                )}
                {!paid && !pending && booking.courseSlug && (
                  <a href={`/enroll/${booking.courseSlug}`} className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Enroll Again</a>
                )}
                <a href="/courses" className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Browse More Courses</a>
              </div>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}

