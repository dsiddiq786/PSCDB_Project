import { Container, PageHeader, Reveal, SectionHeading } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CodeTag } from "../Catalogue/CourseParts";
import { formatPkr, formatUsd, totals } from "../Catalogue/pricing";

export default function PaymentsPage() {
  const { courses, rate } = useCatalogue();

  const rules = [
    ["Course fee", "Each course has one fee that covers all classes in your batch."],
    ["Exam fee", "The professional skills exam is charged separately, unless the institute covers it for that course. The course page always shows which applies."],
    ["Currency", `Fees are charged in US dollars. Rupee amounts are shown for reference${rate ? ` at the current rate of PKR ${rate} per US dollar` : ""}, which the institute updates.`],
    ["Seat hold", "When you continue to payment, your seat is held for 30 minutes. If payment is not completed in that time, the seat is released for other students."],
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Fees and payments" }]}
        eyebrow="Fees and payments"
        title="Clear fees, paid securely online"
        intro="See exactly what each course costs before you enrol. Payments are processed by Stripe, and PSCDB never sees or stores your card details."
      >
        <a href="/programmes" className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">Choose a course</a>
      </PageHeader>

      <section aria-labelledby="rules-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="rules-heading" eyebrow="How fees work" title="What you pay and when" /></Reveal>
          <dl className="mt-12 grid gap-5 md:grid-cols-2">
            {rules.map(([term, detail], index) => (
              <Reveal key={term} delay={index * 70} className="h-full">
                <div className="h-full rounded-xl border border-line bg-white p-6">
                  <dt className="font-display text-lg font-bold text-ink">{term}</dt>
                  <dd className="mt-2 text-sm leading-7 text-muted">{detail}</dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="fees-heading" className="bg-white py-20">
        <Container>
          <Reveal><SectionHeading id="fees-heading" eyebrow="Fee schedule" title="Fees for every course" /></Reveal>
          <div className="mt-10 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Course fees, exam fees and totals</caption>
              <thead className="bg-cream-100 text-xs uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">Course</th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold">Course fee</th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold">Exam fee</th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {courses.map((course) => {
                  const t = totals(course);
                  return (
                    <tr key={course.slug}>
                      <th scope="row" className="px-5 py-4">
                        <CodeTag code={course.code} />
                        <a href={`/programmes/${course.slug}`} className="mt-2 block font-semibold text-ink hover:text-emerald-800">{course.title}</a>
                      </th>
                      <td className="tabular px-5 py-4 text-right text-body">{formatUsd(t.feeUsd)}</td>
                      <td className="tabular px-5 py-4 text-right text-body">{course.examIncludedByInstitute ? "Included" : formatUsd(t.examFeeUsd)}</td>
                      <td className="tabular px-5 py-4 text-right">
                        <span className="block font-semibold text-ink">{formatUsd(t.totalUsd)}</span>
                        {formatPkr(t.totalUsd, rate) && <span className="block text-xs text-muted">{formatPkr(t.totalUsd, rate)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section aria-labelledby="help-heading" className="bg-cream-100 py-16">
        <Container className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-6">
            <h2 id="help-heading" className="font-display text-lg font-bold text-ink">Refunds and batch changes</h2>
            <p className="mt-2 text-sm leading-7 text-muted">To ask about a refund or to move to the other batch, contact admissions with your booking reference.</p>
            <a href="/contact?topic=payment" className="mt-4 inline-block text-sm font-semibold text-emerald-800 hover:underline">Contact admissions →</a>
          </div>
          <div className="rounded-xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-bold text-ink">Payment problems</h2>
            <p className="mt-2 text-sm leading-7 text-muted">If your card was charged but you did not receive a booking reference, do not pay again. Contact us and we will check the payment.</p>
            <a href="/contact?topic=payment" className="mt-4 inline-block text-sm font-semibold text-emerald-800 hover:underline">Report a payment problem →</a>
          </div>
        </Container>
      </section>
    </>
  );
}
