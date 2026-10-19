import { Container, PageHeader, Reveal, SectionHeading } from "./ui";

const paths = [
  { title: "Security Engineering", text: "Roles in penetration testing, application security and secure development." },
  { title: "Security Operations", text: "Roles in monitoring, detection engineering and incident response." },
  { title: "Machine Learning and AI", text: "Roles in model development, evaluation, fine-tuning and applied AI systems." },
  { title: "AI Security", text: "Roles that test, secure and govern AI systems and the data they use." },
];

export default function CareersPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Careers" }]}
        eyebrow="Careers"
        title="Careers for Graduates of Our Labs"
        intro="We work with employers who need people who can build and secure modern AI systems and defend their infrastructure. Opportunities are listed here once they have been checked."
        image="/images/lab/cyber-lab-room.jpg"
        imageAlt="Students at work in the Cyber Security Lab"
        illustrative
      />
      <section aria-labelledby="paths-heading" className="bg-cream-100 py-20">
        <Container>
          <Reveal><SectionHeading id="paths-heading" eyebrow="Career Paths" title="Where Our Courses Can Lead" /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {paths.map((path, index) => (
              <Reveal key={path.title} delay={index * 70} className="h-full">
                <article className="h-full rounded-xl border border-line bg-white p-6">
                  <h3 className="font-display text-xl font-bold text-ink">{path.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{path.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-12 rounded-xl border border-gold-300 bg-gold-50 p-8 text-center sm:p-12">
              <h2 className="font-display text-2xl font-bold text-ink">No Opportunities Are Listed Yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted">
                Tell us about your skills and goals, and we will contact you when a suitable opportunity is available. Employers can also register their interest in hiring our graduates.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a href="/contact?topic=opportunity" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">Register Your Interest</a>
                <a href="/contact?topic=partnership" className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink hover:border-emerald-700">Employer Inquiry</a>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
