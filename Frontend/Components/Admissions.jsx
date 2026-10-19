import { useMemo, useState } from "react";
import { Container, PageHeader, Reveal, SectionHeading } from "./ui";
import { Icon } from "./icons";
import { useCatalogue } from "../Modules/Catalogue/catalogueContext";
import { CodeTag, LabTag } from "../Modules/Catalogue/CourseParts";
import { formatUsd } from "../Modules/Catalogue/pricing";

const checklist = [
  "Your CNIC or passport number",
  "An email address and a phone number",
  "Your highest qualification",
  "A debit or credit card for payment in US dollars",
];

const facts = [
  { icon: "pin", title: "On-Site Classes", text: "Taught in our labs in Sahiwal" },
  { icon: "clock", title: "Two Batch Times", text: "Morning or evening, same syllabus" },
  { icon: "award", title: "Exam in Every Course", text: "A professional skills exam at the end" },
  { icon: "lock", title: "Secure Payment", text: "Processed by Stripe in US dollars" },
];

const steps = [
  { icon: "search", title: "Choose a Course", text: "Read the outcomes, modules and prerequisites, and check that the course fits your background." },
  { icon: "clock", title: "Pick a Batch", text: "Choose the morning or evening batch. You can see how many seats are left before you continue." },
  { icon: "user", title: "Enter Your Details", text: "Give your name, contact details, CNIC or passport number and your highest qualification." },
  { icon: "card", title: "Pay Online", text: "Review the course fee and the exam fee, then pay securely in US dollars. Your seat is held while you pay." },
  { icon: "ticket", title: "Get Your Reference", text: "You receive a booking reference at once. Admissions then confirms your timetable and joining instructions." },
];

const batches = [
  {
    id: "morning",
    icon: "sun",
    name: "Morning Batch",
    text: "Suits full-time students and anyone who prefers to learn early in the day.",
    tone: "bg-gradient-to-br from-gold-50 via-white to-white",
    iconTone: "bg-gold-200 text-gold-600",
  },
  {
    id: "evening",
    icon: "moon",
    name: "Evening Batch",
    text: "Suits working professionals who want to study after office hours.",
    tone: "bg-gradient-to-br from-emerald-50 via-white to-white",
    iconTone: "bg-emerald-100 text-emerald-800",
  },
];

const levels = [
  { level: "Beginner", bars: 1, text: "Basic programming experience and high school mathematics. No prior security or AI background is required." },
  { level: "Intermediate", bars: 2, text: "Comfort with the Linux command line, networking fundamentals (TCP/IP, DNS and HTTP) and some scripting." },
  { level: "Advanced", bars: 3, text: "The prerequisites listed on each course, usually earlier coursework or professional experience in machine learning, networking or security." },
];

const labFilters = [
  { value: "all", label: "All Courses" },
  { value: "ai", label: "AI Lab" },
  { value: "cyber", label: "Cyber Lab" },
];

const questions = [
  { q: "Are any classes held online?", a: "No. Every course is taught on-site in our labs in Sahiwal." },
  { q: "How long is my seat held while I pay?", a: "Your seat is held for 30 minutes from the moment you continue to payment. If payment is not completed in that time, the seat is released for other students." },
  { q: "Is the exam fee included in the course fee?", a: "It depends on the course. Some courses include the professional skills exam fee, and others charge it separately. Each course page and the fees page show which applies." },
  { q: "Can I move to another batch after enrolling?", a: "Contact admissions with your booking reference. A change depends on seats being available in the batch you want." },
  { q: "Which currency will I pay in?", a: "All fees are charged in US dollars. Rupee amounts are shown for reference at the rate set by the institute; your bank may apply its own exchange rate." },
];

function LevelMeter({ bars }) {
  return (
    <span aria-hidden="true" className="flex items-end gap-1">
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={`w-1.5 rounded-sm ${bar <= bars ? "bg-emerald-600" : "bg-line"}`} style={{ height: `${6 + bar * 4}px` }} />
      ))}
    </span>
  );
}

function PrerequisiteRow({ course }) {
  return (
    <article className="group relative grid gap-5 rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_20px_40px_-28px_rgba(6,36,27,0.5)] sm:grid-cols-[180px_1fr] lg:grid-cols-[180px_1fr_auto] lg:items-center">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-cream-100">
        <img src={course.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <CodeTag code={course.code} />
          <LabTag lab={course.lab} />
          <span className="text-xs font-medium text-muted">{course.level} · {course.duration}</span>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">
          <a href={`/courses/${course.slug}`} className="after:absolute after:inset-0 group-hover:text-emerald-800">{course.title}</a>
        </h3>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">You Should Know</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {course.prerequisites.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-body">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-700" strokeWidth={2.4} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line pt-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="lg:text-right">
          <p className="text-xs text-muted">Course Fee</p>
          <p className="tabular font-display text-2xl font-extrabold text-ink">{formatUsd(course.feeUsd)}</p>
        </div>
        <span className="relative z-10 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
          View course <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

export default function AdmissionsPage() {
  const { courses } = useCatalogue();
  const [lab, setLab] = useState("all");

  const visible = useMemo(() => courses.filter((course) => lab === "all" || course.lab === lab), [courses, lab]);
  const byLevel = (level) => courses.filter((course) => course.level === level);

  const aside = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-400/15 text-gold-300"><Icon name="receipt" /></span>
        <div>
          <p className="font-display text-lg font-bold text-white">Before You Start</p>
          <p className="text-sm text-white/60">Have these ready to enroll in one go</p>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {checklist.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/85 ring-1 ring-white/5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Admissions" }]}
        eyebrow="Admissions"
        title="Reserve Your Seat in a Few Minutes"
        intro="Enrollment is fully online. Seats are limited in every batch and are allocated in the order that payments are completed."
        aside={aside}
      >
        <a href="/courses" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">
          Choose a Course <Icon name="arrow" className="h-4 w-4" />
        </a>
        <a href="/contact?topic=admission" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">Ask Admissions</a>
      </PageHeader>

      <div className="bg-cream-100">
        <Container className="relative -top-8 sm:-top-10">
          <ul className="grid overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_48px_-32px_rgba(6,36,27,0.45)] sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((fact, index) => (
              <li key={fact.title} className={`flex items-center gap-4 p-5 sm:p-6 ${index > 0 ? "border-t border-line sm:border-t-0" : ""} ${index % 2 ? "sm:border-l" : ""} ${index > 1 ? "sm:border-t lg:border-t-0" : ""} lg:border-l lg:first:border-l-0`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon name={fact.icon} /></span>
                <div>
                  <p className="font-display text-[15px] font-bold text-ink">{fact.title}</p>
                  <p className="text-sm text-muted">{fact.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <section aria-labelledby="steps-heading" className="bg-cream-100 pb-20 pt-6">
        <Container>
          <Reveal><SectionHeading id="steps-heading" eyebrow="Enrollment Process" title="From Choosing a Course to Your First Class" align="center">Five short steps, all online. You can see the fee and seats before you pay anything.</SectionHeading></Reveal>
          <ol className="relative mt-14 grid gap-6 lg:grid-cols-5 lg:gap-5">
            <span aria-hidden="true" className="absolute left-[10%] right-[10%] top-7 hidden h-px bg-gradient-to-r from-emerald-700/0 via-emerald-700/40 to-emerald-700/0 lg:block" />
            {steps.map((step, index) => (
              <Reveal key={step.title} as="li" delay={index * 90} className="relative">
                <div className="flex gap-5 lg:flex-col lg:items-center lg:text-center">
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-gold-300 shadow-[0_12px_24px_-12px_rgba(6,36,27,0.8)] ring-4 ring-cream-100">
                    <Icon name={step.icon} className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gold-400 font-display text-[11px] font-extrabold text-emerald-950">{index + 1}</span>
                  </span>
                  <div className="lg:mt-5">
                    <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="batches-heading" className="bg-white py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <SectionHeading id="batches-heading" eyebrow="Batches" title="Learn at the Time That Suits You">
              Every course runs in a morning and an evening batch. Both follow the same syllabus and end with the same professional skills exam.
            </SectionHeading>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream-100 px-4 py-2 text-sm text-body">
              <Icon name="user" className="h-4 w-4 text-emerald-700" />
              Seats in every batch are limited
            </p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {batches.map((batch, index) => (
              <Reveal key={batch.id} delay={index * 100} className="h-full">
                <div className={`card-lift flex h-full flex-col rounded-2xl border border-line p-7 ${batch.tone}`}>
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${batch.iconTone}`}><Icon name={batch.icon} className="h-6 w-6" /></span>
                  <h3 className="mt-6 font-display text-xl font-bold text-ink">{batch.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{batch.text}</p>
                  <p className="mt-auto pt-6 text-xs font-medium text-muted">Class times are confirmed by admissions after you enroll.</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="entry-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="entry-heading" eyebrow="Entry Requirements" title="What Each Level Expects">Every course page lists its own prerequisites. As a guide, this is what we expect at each level.</SectionHeading></Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {levels.map((item, index) => {
              const list = byLevel(item.level);
              return (
                <Reveal key={item.level} delay={index * 90} className="h-full">
                  <div className="card-lift flex h-full flex-col rounded-2xl border border-line bg-white p-7">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-ink">{item.level}</h3>
                      <LevelMeter bars={item.bars} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted">{item.text}</p>
                    {list.length > 0 && (
                      <div className="mt-auto pt-6">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Courses at This Level</p>
                        <ul className="mt-3 flex flex-col gap-2">
                          {list.map((course) => (
                            <li key={course.slug}>
                              <a href={`/courses/${course.slug}`} className="group/link flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-emerald-700/40 hover:bg-emerald-50/50">
                                <span className="min-w-0 leading-snug"><span className="font-mono text-[11px] font-semibold text-muted">{course.code}</span> {course.title}</span>
                                <Icon name="arrow" className="h-4 w-4 shrink-0 text-emerald-700 transition-transform group-hover/link:translate-x-0.5" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section aria-labelledby="prereq-heading" className="bg-white py-20">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal><SectionHeading id="prereq-heading" eyebrow="Course by Course" title="Prerequisites and Fees" /></Reveal>
            <div role="group" aria-label="Filter by lab" className="inline-flex self-start rounded-full border border-line bg-cream-100 p-1">
              {labFilters.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={lab === option.value}
                  onClick={() => setLab(option.value)}
                  className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${lab === option.value ? "bg-emerald-950 text-white shadow" : "text-body hover:text-ink"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 grid gap-4">
            {visible.map((course, index) => (
              <Reveal key={course.slug} delay={Math.min(index, 4) * 60}><PrerequisiteRow course={course} /></Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-heading" className="bg-cream-100 py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading id="faq-heading" eyebrow="Questions" title="Common Questions About Admission">
              Cannot find your answer? Admissions can help with anything about courses, batches or payments.
            </SectionHeading>
            <a href="/contact?topic=admission" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">
              <Icon name="mail" className="h-4 w-4" /> Contact Admissions
            </a>
          </Reveal>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {questions.map((item) => (
              <details key={item.q} className="group px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-100 text-emerald-800 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-sm leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="admissions-cta" className="surface-dark texture-grid py-16">
        <Container className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 id="admissions-cta" className="font-display text-3xl font-bold text-white">Ready to Reserve Your Seat?</h2>
            <p className="mt-2 text-white/70">Choose a course and batch, and pay securely online.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/courses" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">Browse Courses <Icon name="arrow" className="h-4 w-4" /></a>
            <a href="/fees" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">See All Fees</a>
          </div>
        </Container>
      </section>
    </>
  );
}
