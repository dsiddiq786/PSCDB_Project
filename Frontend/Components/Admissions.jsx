import { Container, PageHeader, Reveal, SectionHeading } from "./ui";
import { useCatalogue } from "../Modules/Catalogue/catalogueContext";
import { CodeTag } from "../Modules/Catalogue/CourseParts";
import { formatUsd } from "../Modules/Catalogue/pricing";

const steps = [
  { title: "Choose a course", text: "Read the outcomes, modules and prerequisites, and check that the course fits your background." },
  { title: "Pick a batch", text: "Choose the morning or evening batch. You can see how many seats are left before you continue." },
  { title: "Enter your details", text: "Give your name, contact details, CNIC or passport number and your highest qualification." },
  { title: "Pay online", text: "Review the course fee and the exam fee, then pay securely in US dollars. Your seat is held while you pay." },
  { title: "Receive confirmation", text: "You get a booking reference at once. Admissions then confirms your timetable and joining instructions." },
];

const levels = [
  { level: "Beginner", text: "Basic programming experience and high school mathematics. No prior security or AI background is required." },
  { level: "Intermediate", text: "Comfort with the Linux command line, networking fundamentals (TCP/IP, DNS and HTTP) and some scripting." },
  { level: "Advanced", text: "The prerequisites listed on each course, usually earlier coursework or professional experience in machine learning, networking or security." },
];

export default function AdmissionsPage() {
  const { courses } = useCatalogue();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Admissions" }]}
        eyebrow="Admissions"
        title="How to enrol"
        intro="Enrolment is online and takes a few minutes. Seats are limited in every batch and are allocated in the order that payments are completed."
        image="/images/optimised/campus-welcome.jpg"
        imageAlt="Students outside the PSCDB campus"
      >
        <a href="/programmes" className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">Choose a course</a>
        <a href="/contact?topic=admission" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">Ask admissions</a>
      </PageHeader>

      <section aria-labelledby="steps-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="steps-heading" eyebrow="Enrolment process" title="Five steps from choosing a course to your first class" /></Reveal>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <Reveal key={step.title} as="li" delay={index * 70} className="h-full">
                <div className="h-full rounded-xl border border-line bg-white p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-950 font-display text-sm font-bold text-gold-300">{index + 1}</span>
                  <h3 className="mt-5 font-display text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="entry-heading" className="bg-white py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal><SectionHeading id="entry-heading" eyebrow="Entry requirements" title="What each level expects" /></Reveal>
          <div className="grid gap-4">
            {levels.map((item, index) => (
              <Reveal key={item.level} delay={index * 80}>
                <div className="rounded-xl border border-line bg-cream-100 p-6">
                  <h3 className="font-display text-lg font-bold text-ink">{item.level}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="prereq-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="prereq-heading" eyebrow="Courses" title="Prerequisites and fees by course" /></Reveal>
          <div className="mt-10 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <caption className="sr-only">Prerequisites and fees for every course</caption>
              <thead className="bg-cream-100 text-xs uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">Course</th>
                  <th scope="col" className="px-5 py-4 font-semibold">Level</th>
                  <th scope="col" className="px-5 py-4 font-semibold">Prerequisites</th>
                  <th scope="col" className="px-5 py-4 text-right font-semibold">Course fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {courses.map((course) => (
                  <tr key={course.slug} className="align-top">
                    <th scope="row" className="px-5 py-4">
                      <CodeTag code={course.code} />
                      <a href={`/programmes/${course.slug}`} className="mt-2 block font-semibold text-ink hover:text-emerald-800">{course.title}</a>
                    </th>
                    <td className="px-5 py-4 text-body">{course.level}</td>
                    <td className="px-5 py-4 leading-6 text-body">{course.prerequisites.join("; ")}</td>
                    <td className="tabular px-5 py-4 text-right font-semibold text-ink">{formatUsd(course.feeUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
