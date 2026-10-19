import { useRef, useState } from "react";
import HeroSection from "../../Components/heroSection";
import { Container, Eyebrow, IllustrativeTag, Reveal, SectionHeading } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CourseCard } from "../Catalogue/CourseParts";
import { formatPkr, formatUsd } from "../Catalogue/pricing";
import { labMeta } from "../Catalogue/labMeta";
import { labs } from "../Labs/labsData";
import { leadership } from "../Leadership/leadershipData";

const facts = [
  ["Two specialist labs", "Artificial intelligence and cyber security"],
  ["Professional skills exams", "Every course leads to a professional skills exam"],
  ["Morning and evening batches", "Onsite classes in Sahiwal, Pakistan"],
  ["Published fees", "See the full cost before you enrol"],
];

const steps = [
  { title: "Choose a course", text: "Compare outcomes, modules, prerequisites and fees." },
  { title: "Pick a batch", text: "Select the morning or evening batch and check the seats available." },
  { title: "Confirm and pay", text: "Enter your details, review the total and pay securely online." },
  { title: "Start your classes", text: "You receive a booking reference straight away, and admissions confirms your timetable." },
];

const faqs = [
  { q: "Are the classes online or onsite?", a: "All classes are currently held onsite at our Sahiwal centre. Each course runs as a morning batch and an evening batch." },
  { q: "Is the exam fee included in the course fee?", a: "The professional skills exam fee is paid separately, unless the institute covers it for a course. The course page shows which applies before you enrol." },
  { q: "Which currency am I charged in?", a: "Fees are charged in US dollars. Amounts in Pakistani rupees are shown for reference at the current rate set by the institute." },
  { q: "Do I need a computer science degree?", a: "No. Each course lists its prerequisites. Beginner courses assume basic programming and mathematics, and advanced courses state the experience they expect." },
  { q: "Is offensive security training lawful?", a: "Yes, when it is practised correctly. Every technique is taught in isolated lab environments, against systems we control, under written rules of engagement and a signed code of conduct." },
];

const factIcons = [
  <path key="a" d="M4 6h16v10H4zM8 20h8M12 16v4" />,
  <path key="b" d="M7 4h10v5a5 5 0 0 1-10 0V4ZM12 14v4M8 20h8" />,
  <path key="c" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2" />,
  <path key="d" d="M4 7h16M4 12h16M4 17h10" />,
];

function Facts() {
  return (
    <section aria-label="Key facts" className="border-b border-line bg-white">
      <Container>
        <div className="grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-4">
        {facts.map(([title, text], index) => (
          <div key={title} className="flex gap-4 bg-white px-1 py-7 sm:px-5 lg:first:pl-0">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{factIcons[index]}</svg>
            </span>
            <div>
              <p className="font-display text-base font-bold text-ink">{title}</p>
              <p className="mt-0.5 text-sm leading-6 text-muted">{text}</p>
            </div>
          </div>
        ))}
        </div>
      </Container>
    </section>
  );
}

function Courses() {
  const { courses, rate } = useCatalogue();
  const [lab, setLab] = useState("all");
  const railRef = useRef(null);
  const visible = lab === "all" ? courses : courses.filter((course) => course.lab === lab);
  const minFee = courses.length ? Math.min(...courses.map((course) => course.feeUsd)) : null;

  const scrollRail = (direction) => {
    const rail = railRef.current;
    const card = rail?.firstElementChild;
    if (!rail || !card) return;
    rail.scrollBy({ left: direction * (card.getBoundingClientRect().width + 24), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="courses-heading" className="bg-white py-20 sm:py-24">
      <Container>
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading id="courses-heading" eyebrow="Courses" title="Choose the course that moves your career forward">
            Fees start from {formatUsd(minFee)}
            {formatPkr(minFee, rate) ? ` (${formatPkr(minFee, rate)})` : ""}. Each course runs as a morning batch and an evening batch.
          </SectionHeading>
          <a href="/programmes" className="shrink-0 text-sm font-semibold text-emerald-800 hover:underline">View all courses →</a>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter courses by lab" className="flex flex-wrap gap-2">
            {[{ value: "all", label: "All courses" }, { value: "ai", label: "AI Lab" }, { value: "cyber", label: "Cyber Lab" }].map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={lab === item.value}
                onClick={() => {
                  setLab(item.value);
                  railRef.current?.scrollTo({ left: 0 });
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  lab === item.value ? "bg-emerald-950 text-white" : "bg-cream-100 text-body hover:bg-cream-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous courses" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink hover:border-emerald-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={() => scrollRail(1)} aria-label="Next courses" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink hover:border-emerald-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          tabIndex={0}
          aria-label="Courses"
          className="mt-8 grid snap-x snap-mandatory auto-cols-[85%] grid-flow-col gap-6 overflow-x-auto pb-4 [scrollbar-width:thin] sm:auto-cols-[calc((100%-1.5rem)/2)] lg:auto-cols-[calc((100%-3rem)/3)] xl:auto-cols-[calc((100%-4.5rem)/4)]"
        >
          {visible.map((course, index) => (
            <Reveal key={`${lab}-${course.slug}`} delay={Math.min(index, 4) * 80} className="snap-start">
              <CourseCard course={course} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Labs() {
  return (
    <section aria-labelledby="labs-heading" className="surface-dark texture-grid py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading tone="dark" id="labs-heading" eyebrow="Our labs" title="Two labs, built for hands-on practice">
            Every course is taught in a dedicated lab, on equipment set up for the work you will do after you graduate.
          </SectionHeading>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[labs.ai, labs.cyber].map((lab, index) => {
            const meta = labMeta[lab.slug];
            return (
              <Reveal key={lab.slug} delay={index * 120} className="h-full">
                <a href={`/labs/${lab.slug}`} className="card-lift card-lift-dark group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  <figure className="relative aspect-[16/9] overflow-hidden">
                    <img src={meta.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <IllustrativeTag />
                  </figure>
                  <div className="flex flex-1 flex-col p-7">
                    <p className={`text-xs font-bold uppercase tracking-[0.16em] ${lab.slug === "ai" ? "text-emerald-300" : "text-cyber-100"}`}>{lab.name}</p>
                    <h3 className="mt-3 font-display text-2xl font-bold text-white">{lab.headline}</h3>
                    <ul className="mt-5 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                      {lab.pillars.map((pillar) => (
                        <li key={pillar.title} className="flex items-center gap-2">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                          {pillar.title}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-6 text-sm font-semibold text-gold-300 group-hover:underline">Explore the {lab.shortName} →</span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section aria-labelledby="steps-heading" className="bg-cream-100 py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading id="steps-heading" eyebrow="Enrolment" title="Reserve your seat in four steps" />
        </Reveal>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} as="li" delay={index * 90} className="h-full">
              <div className="h-full rounded-xl border border-line bg-white p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-950 font-display text-sm font-bold text-gold-300">{index + 1}</span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10">
          <a href="/programmes" className="inline-flex min-h-12 items-center rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white hover:bg-emerald-800">Choose a course</a>
        </Reveal>
      </Container>
    </section>
  );
}

function International() {
  return (
    <section aria-labelledby="international-heading" className="bg-white py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <figure className="relative overflow-hidden rounded-xl">
            <img src="/images/lab/ai-lab-team.jpg" alt="Learners working together in the AI Lab" loading="lazy" className="aspect-[16/10] w-full object-cover" />
            <IllustrativeTag />
          </figure>
        </Reveal>
        <Reveal delay={120}>
          <Eyebrow>For international students</Eyebrow>
          <h2 id="international-heading" className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">Apply from abroad with the same support</h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Enrol online with your passport number, pay in US dollars, and our admissions team will explain the documents you need before your batch begins.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-body">
            {["Fees charged in US dollars", "Passport accepted for identification", "Admissions guidance on travel documents", "Written confirmation of your seat and timetable"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a href="/contact?topic=admission" className="mt-8 inline-flex min-h-11 items-center rounded-lg border border-ink/15 px-5 text-sm font-semibold text-ink hover:border-emerald-700 hover:text-emerald-800">Talk to admissions</a>
        </Reveal>
      </Container>
    </section>
  );
}

function Leadership() {
  return (
    <section aria-labelledby="leadership-heading" className="bg-cream-100 py-20 sm:py-24">
      <Container>
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading id="leadership-heading" eyebrow="Leadership" title="The people responsible for PSCDB" />
          <a href="/leadership" className="shrink-0 text-sm font-semibold text-emerald-800 hover:underline">Meet the leadership →</a>
        </Reveal>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {leadership.map((person, index) => (
            <Reveal key={person.name} delay={index * 80}>
              <article>
                <div className="aspect-square overflow-hidden rounded-xl bg-cream-200">
                  <img src={person.image} alt={`Portrait of ${person.name}`} loading="lazy" className="h-full w-full object-cover object-top" />
                </div>
                <p className="mt-4 font-display text-base font-bold text-ink">{person.name}</p>
                <p className="text-sm text-muted">{person.role}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Questions() {
  return (
    <section aria-labelledby="faq-heading" className="bg-white py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <SectionHeading id="faq-heading" eyebrow="Questions" title="Frequently asked questions">
            Cannot find your answer? Our admissions team can help.
          </SectionHeading>
          <a href="/contact" className="mt-6 inline-block text-sm font-semibold text-emerald-800 hover:underline">Contact admissions →</a>
        </Reveal>
        <Reveal delay={100}>
          <div className="divide-y divide-line border-y border-line">
            {faqs.map((item, index) => (
              <details key={item.q} open={index === 0} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-base font-bold text-ink">
                  {item.q}
                  <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream-100 text-emerald-800 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Closing() {
  return (
    <section aria-labelledby="closing-heading" className="surface-dark texture-grid py-20">
      <Container className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <Reveal className="max-w-2xl">
          <h2 id="closing-heading" className="font-display text-3xl font-extrabold text-white sm:text-4xl">Seats are limited in every batch</h2>
          <p className="mt-3 text-base leading-7 text-white/75">Choose your course and reserve a morning or evening seat today.</p>
        </Reveal>
        <Reveal delay={100} className="flex flex-wrap gap-3">
          <a href="/programmes" className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">Browse courses</a>
          <a href="/contact" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">Talk to admissions</a>
        </Reveal>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Facts />
      <Courses />
      <Labs />
      <HowItWorks />
      <International />
      <Leadership />
      <Questions />
      <Closing />
    </>
  );
}
