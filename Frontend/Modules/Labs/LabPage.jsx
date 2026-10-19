import { Container, IllustrativeTag, PageHeader, Reveal, SectionHeading } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CourseCard } from "../Catalogue/CourseParts";
import { labMeta } from "../Catalogue/labMeta";
import { labs, labCodeOfConduct } from "./labsData";

const toneClass = { muted: "text-white/40", body: "text-white/85", gold: "text-gold-300" };

export default function LabPage({ slug }) {
  const { courses } = useCatalogue();
  const lab = labs[slug];
  if (!lab) return null;
  const meta = labMeta[slug];
  const labCourses = courses.filter((course) => course.lab === slug);
  const isCyber = slug === "cyber";

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Labs" }, { label: lab.name }]}
        eyebrow={lab.name}
        title={lab.headline}
        intro={lab.intro}
        image={meta.image}
        imageAlt={`Inside the ${lab.name}`}
        illustrative
      >
        <a href="#courses" className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 hover:bg-cream-100">View Courses</a>
        <a href="/admissions" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white hover:border-white">How to Enroll</a>
      </PageHeader>

      <section aria-labelledby="pillars-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal>
            <SectionHeading id="pillars-heading" eyebrow="What the Lab Covers" title={`Core Areas of the ${lab.shortName}`} />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {lab.pillars.map((pillar, index) => (
              <Reveal key={pillar.title} delay={index * 80} className="h-full">
                <article className="h-full rounded-xl border border-line bg-white p-7">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg font-display text-sm font-bold text-white ${isCyber ? "bg-cyber-600" : "bg-emerald-700"}`}>{index + 1}</span>
                  <h3 className="mt-5 font-display text-xl font-bold text-ink">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{pillar.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="facility-heading" className="bg-white py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <figure className="relative overflow-hidden rounded-xl">
              <img src={meta.banner} alt={`Students working in the ${lab.name}`} loading="lazy" className="aspect-[16/7] w-full object-cover" />
              <IllustrativeTag />
            </figure>
          </Reveal>
          <Reveal delay={120}>
            <SectionHeading id="facility-heading" eyebrow="Practical Skills" title="What You Will Be Able to Do" />
            <ul className="mt-6 grid gap-3">
              {lab.capabilities.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-body">
                  <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${isCyber ? "bg-cyber-50 text-cyber-700" : "bg-emerald-50 text-emerald-700"}`}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="environment-heading" className="surface-dark texture-grid py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="min-w-0">
            <SectionHeading tone="dark" id="environment-heading" eyebrow="Lab Environment" title="See the Kind of Work You Will Do">
              {isCyber
                ? "Every exercise has a written scope and runs only inside the isolated lab range."
                : "Training runs are configured, tracked and evaluated so that results can be reproduced."}
            </SectionHeading>
          </Reveal>
          <Reveal delay={120} className="min-w-0">
            <figure className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <span className="font-mono text-xs text-white/60">{lab.codeTitle}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">Example</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7">
                {lab.code.map((line, index) => (
                  <span key={index} className={`block whitespace-pre ${toneClass[line.tone] || toneClass.body}`}>{line.text || " "}</span>
                ))}
              </pre>
            </figure>
          </Reveal>
        </Container>
      </section>

      <section id="courses" aria-labelledby="courses-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal>
            <SectionHeading id="courses-heading" eyebrow="Courses" title={`Courses in the ${lab.shortName}`} />
          </Reveal>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {labCourses.map((course) => <li key={course.slug}><CourseCard course={course} /></li>)}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="conduct-heading" className="bg-white py-16">
        <Container>
          <div className="rounded-xl border border-gold-300 bg-gold-50 p-7 sm:p-10">
            <h2 id="conduct-heading" className="font-display text-2xl font-bold text-ink">Code of Conduct for This Lab</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {labCodeOfConduct.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-body">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
