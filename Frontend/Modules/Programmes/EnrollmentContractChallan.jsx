import { useState } from "react";

function formatAmount(amount, currency) {
  if (amount === null || amount === undefined) {
    return "Fee to be confirmed";
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function EnrollmentContractChallan({
  programme,
  mode,
  student,
  config,
  onBack,
  onPrepare,
}) {
  const [acceptedContract, setAcceptedContract] = useState(false);
  const [error, setError] = useState("");

  const modeConfig = config.modes[mode];
  const fee = modeConfig?.fee;
  const paymentConfigured = Boolean(
    fee !== null &&
      fee !== undefined &&
      config.payment?.bankName &&
      config.payment?.accountTitle &&
      config.payment?.accountNumber,
  );

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!acceptedContract) {
      setError("Please accept the enrollment contract to continue.");
      return;
    }

    const result = onPrepare({ acceptedContract });

    if (!result?.success) {
      setError(result?.message || "Could not prepare your enrollment.");
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#176247] hover:text-[#0B4F3C]"
      >
        <span aria-hidden="true">←</span> Change learning mode
      </button>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#608B3E]">
          Enrollment review
        </p>

        <h1 className="mt-2 text-3xl font-bold text-[#173A30] sm:text-4xl">
          Contract and payment challan
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#718077]">
          Review your programme selection, read the draft terms, and check the
          payment details.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-[#E5EBE3] bg-cream-50 p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#608B3E]">
                  Selected programme
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#173A30]">
                  {programme.title}
                </h2>
              </div>

              <span className="rounded-full bg-[#EFF7E9] px-3 py-1.5 text-xs font-bold capitalize text-[#176247]">
                {modeConfig.label}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-[#F7F9F5] p-4">
                <p className="text-xs text-[#829087]">Class timing</p>
                <p className="mt-1 text-sm font-bold text-[#173A30]">
                  {programme.timing || "To be announced"}
                </p>
              </div>

              <div className="rounded-md bg-[#F7F9F5] p-4">
                <p className="text-xs text-[#829087]">Credit hours</p>
                <p className="mt-1 text-sm font-bold text-[#173A30]">
                  {programme.creditHours ?? "To be announced"}
                </p>
              </div>

              <div className="rounded-md bg-[#F7F9F5] p-4">
                <p className="text-xs text-[#829087]">Student</p>
                <p className="mt-1 text-sm font-bold text-[#173A30]">
                  {student.fullName || "Student"}
                </p>
              </div>

              <div className="rounded-md bg-[#F7F9F5] p-4">
                <p className="text-xs text-[#829087]">Email</p>
                <p className="mt-1 break-all text-sm font-bold text-[#173A30]">
                  {student.email || "Not available"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#E5EBE3] bg-cream-50 p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wide text-[#608B3E]">
              Draft enrollment contract
            </p>

            <h2 className="mt-2 text-xl font-bold text-[#173A30]">
              Student responsibilities
            </h2>

            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[#56675B]">
              {config.contractTerms.map((term, index) => (
                <li key={`${index}-${term}`}>{term}</li>
              ))}
            </ol>

            <p className="mt-5 rounded-xl border border-[#F0E4C8] bg-[#FFFBF1] p-3 text-xs leading-5 text-[#76643A]">
              This is draft UI copy for the prototype. PSCDB should approve
              the final contract terms before accepting real enrollments.
            </p>

            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#56675B]">
              <input
                type="checkbox"
                checked={acceptedContract}
                onChange={(event) =>
                  setAcceptedContract(event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-[#176247]"
              />
              <span>
                I have read and agree to these draft enrollment terms.
              </span>
            </label>
          </section>
        </div>

        <aside className="rounded-md border border-[#DCE9D4] bg-cream-50 p-5 shadow-sm sm:p-7 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#608B3E]">
                Payment
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#173A30]">
                Fee challan
              </h2>
            </div>

            <span className="rounded-full bg-[#FFF5DB] px-3 py-1.5 text-xs font-bold text-[#8B6B1E]">
              {paymentConfigured ? "Draft" : "Not payable"}
            </span>
          </div>

          <div className="mt-5 rounded-md bg-[#F7F9F5] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#829087]">
              Amount due
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#173A30]">
              {formatAmount(fee, config.currency)}
            </p>
            <p className="mt-1 text-xs capitalize text-[#718077]">
              {programme.title} · {modeConfig.label}
            </p>
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#829087]">Bank</dt>
              <dd className="text-right font-semibold text-[#173A30]">
                {config.payment?.bankName || "To be provided"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#829087]">Account title</dt>
              <dd className="text-right font-semibold text-[#173A30]">
                {config.payment?.accountTitle || "To be provided"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#829087]">Account number</dt>
              <dd className="text-right font-semibold text-[#173A30]">
                {config.payment?.accountNumber || "To be provided"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#829087]">IBAN</dt>
              <dd className="text-right font-semibold text-[#173A30]">
                {config.payment?.iban || "To be provided"}
              </dd>
            </div>
          </dl>

          {!paymentConfigured && (
            <p className="mt-5 rounded-xl border border-[#F0E4C8] bg-[#FFFBF1] p-3 text-xs leading-5 text-[#76643A]">
              Fee and official bank details are not configured yet. This
              preview cannot be used to make a payment.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="mt-6 min-h-12 w-full rounded-xl bg-[#176247] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0B4F3C] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#167A62]/20"
            >
              Prepare enrollment payload
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}