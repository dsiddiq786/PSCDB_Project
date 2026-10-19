import { Container, Eyebrow, IllustrativeTag, PageHeader, Reveal, SectionHeading } from "./ui";
import { labCodeOfConduct } from "../Modules/Labs/labsData";

const values = [
  { title: "Rigour", text: "We measure results and report them honestly, including the ones that disappoint." },
  { title: "Responsibility", text: "Powerful skills are taught with clear boundaries, supervision and a duty to the public." },
  { title: "Openness", text: "We publish our fees, our course content and our methods, and we welcome scrutiny." },
  { title: "Practice", text: "Theory matters when it changes what you can build, defend or explain." },
];

export default function AboutUs() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "About" }]}
        eyebrow="About PSCDB"
        title="A professional skills board for advanced technology"
        intro="The Professional Skills and Community Development Board (PSCDB) delivers onsite courses and professional skills exams in artificial intelligence and cyber security."
        image="/images/lab/labs-split.jpg"
        imageAlt="The Advanced AI Lab and the Cyber Security Lab"
        illustrative
      />

      <section aria-labelledby="vision-heading" className="bg-cream-100 py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <Reveal className="h-full">
            <article className="h-full rounded-xl border border-line bg-white p-8 sm:p-10">
              <Eyebrow>Vision</Eyebrow>
              <h2 id="vision-heading" className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">A centre of excellence in AI and cyber security</h2>
              <p className="mt-4 text-base leading-8 text-muted">
                We aim to be a place where engineers and researchers from Pakistan and abroad can develop skills of an international standard, and where the next generation of builders and defenders learns its craft.
              </p>
            </article>
          </Reveal>
          <Reveal delay={100} className="h-full">
            <article className="surface-dark h-full rounded-xl p-8 sm:p-10">
              <Eyebrow tone="dark">Mission</Eyebrow>
              <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">Teach advanced technology the way it is practised</h2>
              <p className="mt-4 text-base leading-8 text-white/75">
                We run practical courses in large language models, AI security, penetration testing, security operations and digital forensics. Every course is delivered in a dedicated lab and ends with a professional skills exam.
              </p>
            </article>
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="values-heading" className="bg-white py-20">
        <Container>
          <Reveal><SectionHeading id="values-heading" eyebrow="Values" title="What guides our work" /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 70} className="h-full">
                <article className="h-full rounded-xl border border-line p-6">
                  <span className="font-display text-sm font-bold text-gold-500">0{index + 1}</span>
                  <h3 className="mt-3 font-display text-xl font-bold text-ink">{value.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{value.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="labs-heading" className="bg-cream-100 py-20">
        <Container className="grid gap-6 md:grid-cols-2">
          {[
            { href: "/labs/ai", image: "/images/lab/ai-lab-team.jpg", title: "Advanced AI Lab", text: "Train, fine-tune and evaluate language models." },
            { href: "/labs/cyber", image: "/images/lab/cyber-lab-team.jpg", title: "Cyber Security Lab", text: "Attack, defend and investigate in isolated ranges." },
          ].map((lab, index) => (
            <Reveal key={lab.href} delay={index * 100}>
              <a href={lab.href} className="card-lift group block overflow-hidden rounded-xl border border-line bg-white">
                <figure className="relative">
                  <img src={lab.image} alt="" loading="lazy" className="aspect-[16/7] w-full object-cover" />
                  <IllustrativeTag />
                </figure>
                <div className="p-6">
                  <h2 id={index === 0 ? "labs-heading" : undefined} className="font-display text-xl font-bold text-ink group-hover:text-emerald-800">{lab.title}</h2>
                  <p className="mt-1 text-sm text-muted">{lab.text}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </Container>
      </section>

      <section id="conduct" aria-labelledby="conduct-heading" className="surface-dark texture-grid py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <SectionHeading tone="dark" id="conduct-heading" eyebrow="Code of conduct" title="Offensive security is taught under strict rules">
              Every student agrees to these commitments before they are given access to any lab environment.
            </SectionHeading>
          </Reveal>
          <Reveal delay={100}>
            <ol className="grid gap-3">
              {labCodeOfConduct.map((item, index) => (
                <li key={item} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="font-display text-sm font-bold text-gold-300">{index + 1}</span>
                  <p className="text-sm leading-7 text-white/80">{item}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>

      <section aria-label="Leadership" className="bg-white py-16">
        <Container className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-cream-100 p-8 sm:p-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Meet the people leading PSCDB</h2>
            <p className="mt-2 text-sm text-muted">Our leadership is responsible for academic standards, governance and partnerships.</p>
          </div>
          <a href="/leadership" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">View leadership</a>
        </Container>
      </section>
    </>
  );
}
