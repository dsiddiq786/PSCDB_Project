import { useMemo, useState } from "react";
import { Container, PageHeader, Reveal, SectionHeading } from "../../Components/ui";
import { Icon } from "../../Components/icons";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CodeTag, LabTag } from "../Catalogue/CourseParts";
import { formatPkr, formatUsd, totals } from "../Catalogue/pricing";

const labFilters = [
  { value: "all", label: "All" },
  { value: "ai", label: "AI Lab" },
  { value: "cyber", label: "Cyber Lab" },
];

const journey = [
  { icon: "timer", title: "Your seat is held", text: "When you continue to payment, your seat is reserved for 30 minutes so nobody else can take it." },
  { icon: "lock", title: "Pay on Stripe", text: "You pay on Stripe's secure checkout page. Your bank may ask you to confirm the payment." },
  { icon: "ticket", title: "Booking confirmed", text: "As soon as payment succeeds you receive a booking reference, and your seat is yours." },
];

const security = [
  "Card details are entered on Stripe's page, never on ours",
  "PSCDB never sees or stores your card number",
  "Every payment is linked to a unique booking reference",
  "If payment fails, you are not charged and can try again",
];

/* A small receipt that shows how a real course is priced. */
function SampleReceipt({ course, rate }) {
  if (!course) return null;
  const t = totals(course);
  return (
    <div className="relative mx-auto max-w-md">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[28px] bg-gold-400/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between bg-cream-100 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Example fee breakdown</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
            <Icon name="lock" className="h-3.5 w-3.5" /> Secure
          </span>
        </div>
        <div className="px-6 pb-6 pt-5">
          <div className="flex items-center gap-2"><CodeTag code={course.code} /><LabTag lab={course.lab} /></div>
          <p className="mt-2 font-display text-lg font-bold leading-snug text-ink">{course.title}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-body">Course fee</dt>
              <dd className="tabular font-semibold text-ink">{formatUsd(t.feeUsd)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-body">Professional skills exam</dt>
              <dd className="tabular font-semibold text-ink">{course.examIncludedByInstitute ? <span className="text-emerald-700">Included</span> : formatUsd(t.examFeeUsd)}</dd>
            </div>
          </dl>
          <div className="my-5 border-t border-dashed border-line" />
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm font-semibold text-ink">Total due</p>
            <div className="text-right">
              <p className="tabular font-display text-3xl font-extrabold leading-none text-ink">{formatUsd(t.totalUsd)}</p>
              {formatPkr(t.totalUsd, rate) && <p className="tabular mt-1 text-xs text-muted">About {formatPkr(t.totalUsd, rate)}</p>}
            </div>
          </div>
          <a href={`/enrol/${course.slug}`} className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">
            <Icon name="lock" className="h-4 w-4" /> Reserve a seat
          </a>
          <p className="mt-3 text-center text-[11px] text-muted">Payments are processed by Stripe</p>
        </div>
      </div>
    </div>
  );
}

function FeeRow({ course, currency, rate }) {
  const t = totals(course);
  const money = (usd) => (currency === "pkr" && rate ? formatPkr(usd, rate) : formatUsd(usd));
  const secondary = (usd) => (currency === "pkr" ? formatUsd(usd) : formatPkr(usd, rate));

  return (
    <article className="group relative grid items-center gap-4 rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_20px_40px_-28px_rgba(6,36,27,0.5)] md:grid-cols-[minmax(0,1fr)_repeat(3,8.5rem)_auto] md:gap-6 md:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <img src={course.thumbnail} alt="" loading="lazy" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><CodeTag code={course.code} /><span className="text-xs text-muted">{course.level} · {course.duration}</span></div>
          <h3 className="mt-1 truncate font-display text-base font-bold text-ink">
            <a href={`/programmes/${course.slug}`} className="after:absolute after:inset-0 group-hover:text-emerald-800">{course.title}</a>
          </h3>
        </div>
      </div>
      <dl className="contents">
        <div className="flex items-center justify-between md:block md:text-right">
          <dt className="text-xs text-muted md:mb-1">Course fee</dt>
          <dd className="tabular text-sm font-semibold text-ink">{money(t.feeUsd)}</dd>
        </div>
        <div className="flex items-center justify-between md:block md:text-right">
          <dt className="text-xs text-muted md:mb-1">Exam fee</dt>
          <dd>
            {course.examIncludedByInstitute ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /> Included
              </span>
            ) : (
              <span className="tabular text-sm font-semibold text-ink">{money(t.examFeeUsd)}</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between md:block md:text-right">
          <dt className="text-xs text-muted md:mb-1">Total</dt>
          <dd>
            <span className="tabular block font-display text-lg font-extrabold text-ink">{money(t.totalUsd)}</span>
            {secondary(t.totalUsd) && <span className="tabular block text-[11px] text-muted">{secondary(t.totalUsd)}</span>}
          </dd>
        </div>
      </dl>
      <a href={`/enrol/${course.slug}`} className="relative z-10 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-emerald-700/30 px-4 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white">
        Enrol <Icon name="arrow" className="h-4 w-4" />
      </a>
    </article>
  );
}

export default function PaymentsPage() {
  const { courses, rate } = useCatalogue();
  const [lab, setLab] = useState("all");
  const [currency, setCurrency] = useState("usd");

  const cheapest = useMemo(() => [...courses].sort((a, b) => a.feeUsd - b.feeUsd)[0], [courses]);
  const visible = useMemo(() => courses.filter((course) => lab === "all" || course.lab === lab).sort((a, b) => a.feeUsd - b.feeUsd), [courses, lab]);

  const rules = [
    { icon: "book", title: "Course fee", text: "One fee per course that covers every class in your batch. There are no hidden charges." },
    { icon: "award", title: "Exam fee", text: "The professional skills exam is charged separately, unless the institute covers it for that course." },
    { icon: "currency", title: "Currency", text: `Fees are charged in US dollars. Rupee amounts are a guide${rate ? ` at PKR ${rate} to the dollar` : ""}, and your bank may use its own rate.` },
    { icon: "timer", title: "Seat hold", text: "Your seat is held for 30 minutes while you pay. After that it is released for other students." },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Fees and payments" }]}
        eyebrow="Fees and payments"
        title="Clear fees, paid securely online"
        intro="See exactly what each course costs before you enrol. Payments are processed by Stripe, and PSCDB never sees or stores your card details."
        aside={<SampleReceipt course={cheapest} rate={rate} />}
      >
        <a href="#fees-heading" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">See all fees</a>
        <a href="/programmes" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">Browse courses</a>
      </PageHeader>

      <section aria-labelledby="rules-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="rules-heading" eyebrow="How fees work" title="What you pay, and when" align="center" /></Reveal>
          <dl className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rules.map((rule, index) => (
              <Reveal key={rule.title} delay={index * 80} className="h-full">
                <div className="card-lift h-full rounded-2xl border border-line bg-white p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-950 text-gold-300"><Icon name={rule.icon} className="h-6 w-6" /></span>
                  <dt className="mt-5 font-display text-lg font-bold text-ink">{rule.title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{rule.text}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="fees-heading" className="scroll-mt-24 bg-white py-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal><SectionHeading id="fees-heading" eyebrow="Fee schedule" title="Fees for every course">Sorted from the lowest fee. Switch currency to see rupee amounts first.</SectionHeading></Reveal>
            <div className="flex flex-wrap gap-3">
              <div role="group" aria-label="Filter by lab" className="inline-flex rounded-full border border-line bg-cream-100 p-1">
                {labFilters.map((option) => (
                  <button key={option.value} type="button" aria-pressed={lab === option.value} onClick={() => setLab(option.value)}
                    className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${lab === option.value ? "bg-emerald-950 text-white shadow" : "text-body hover:text-ink"}`}>
                    {option.label}
                  </button>
                ))}
              </div>
              <div role="group" aria-label="Currency" className="inline-flex rounded-full border border-line bg-cream-100 p-1">
                {[["usd", "USD"], ["pkr", "PKR"]].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={currency === value} onClick={() => setCurrency(value)} disabled={value === "pkr" && !rate}
                    className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${currency === value ? "bg-gold-400 text-emerald-950 shadow" : "text-body hover:text-ink"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 hidden grid-cols-[minmax(0,1fr)_repeat(3,8.5rem)_auto] gap-6 px-5 pb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted md:grid">
            <span>Course</span><span className="text-right">Course fee</span><span className="text-right">Exam fee</span><span className="text-right">Total</span><span className="w-[5.5rem]" />
          </div>
          <div className="mt-4 grid gap-3 md:mt-0">
            {visible.map((course, index) => (
              <Reveal key={course.slug} delay={Math.min(index, 5) * 50}><FeeRow course={course} currency={currency} rate={rate} /></Reveal>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-sm text-muted">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
            You are always charged in US dollars. Rupee amounts are for guidance only.
          </p>
        </Container>
      </section>

      <section aria-labelledby="journey-heading" className="surface-dark texture-grid py-20">
        <Container>
          <Reveal><SectionHeading id="journey-heading" tone="dark" eyebrow="Paying for your seat" title="What happens when you pay" align="center" /></Reveal>
          <ol className="relative mt-14 grid gap-8 md:grid-cols-3">
            <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-8 hidden h-px border-t border-dashed border-white/25 md:block" />
            {journey.map((step, index) => (
              <Reveal key={step.title} as="li" delay={index * 110} className="relative text-center">
                <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.07] text-gold-300 ring-1 ring-white/15 backdrop-blur">
                  <Icon name={step.icon} className="h-7 w-7" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-gold-300">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-xl font-bold text-white">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/70">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="security-heading" className="bg-cream-100 py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading id="security-heading" eyebrow="Security" title="Your payment details stay with Stripe">
              Stripe is a global payment provider certified to the highest level of the card industry's security standard (PCI DSS Level 1).
            </SectionHeading>
          </Reveal>
          <ul className="grid gap-3 sm:grid-cols-2">
            {security.map((item, index) => (
              <Reveal key={item} as="li" delay={index * 70} className="h-full">
                <div className="flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon name="shield" className="h-5 w-5" /></span>
                  <p className="text-sm font-medium leading-6 text-ink">{item}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="help-heading" className="bg-white py-20">
        <Container>
          <Reveal><SectionHeading id="help-heading" eyebrow="Help" title="Need help with a payment?" /></Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { icon: "refresh", title: "Refunds and batch changes", text: "To ask about a refund or to move to the other batch, contact admissions with your booking reference.", cta: "Contact admissions" },
              { icon: "alert", title: "Charged but no reference?", text: "If your card was charged but you did not receive a booking reference, do not pay again. Contact us and we will check the payment.", cta: "Report a payment problem" },
            ].map((card, index) => (
              <Reveal key={card.title} delay={index * 90} className="h-full">
                <a href="/contact?topic=payment" className="card-lift group flex h-full gap-5 rounded-2xl border border-line bg-cream-100/60 p-7 hover:border-emerald-700/30">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 ring-1 ring-line"><Icon name={card.icon} className="h-6 w-6" /></span>
                  <span>
                    <span className="block font-display text-lg font-bold text-ink">{card.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-muted">{card.text}</span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                      {card.cta} <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
