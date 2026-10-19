import { Reveal, SectionHeading, Container } from "./ui";

const pathways = [
  {
    title: "Skills programmes",
    description:
      "Structured courses in digital, creative and professional skills, built around practical work you can show to employers.",
    linkText: "Browse programmes",
    href: "/courses",
    icon: (
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5v-14Zm0 14A2.5 2.5 0 0 0 6.5 23H20v-4" />
    ),
  },
  {
    title: "Learner guidance",
    description:
      "Talk to our team about choosing a programme, planning your schedule and the support available while you study.",
    linkText: "Ask a question",
    href: "/contact",
    icon: (
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    ),
  },
  {
    title: "Career opportunities",
    description:
      "Find internships, jobs and scholarships. We publish only opportunities that have been checked before they are listed.",
    linkText: "View opportunities",
    href: "/opportunities",
    icon: (
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-10 0h16v12H4V7Zm0 5h16" />
    ),
  },
];

export default function PathwaysSection() {
  return (
    <section aria-labelledby="pathways-heading" className="bg-cream-50 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            id="pathways-heading"
            eyebrow="Where to start"
            title="One community. Three ways forward."
          >
            Choose the pathway that fits your goals. Learn a new skill, get personal guidance or find your
            next opportunity.
          </SectionHeading>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {pathways.map((pathway, index) => (
            <Reveal key={pathway.title} delay={index * 120}>
              <a
                href={pathway.href}
                className="card-lift group flex h-full flex-col rounded-sm border border-line bg-cream-50 p-8"
              >
                <span className="grid h-14 w-14 place-items-center rounded-sm bg-brand-100 text-brand-700 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {pathway.icon}
                  </svg>
                </span>

                <h3 className="mt-7 text-xl font-bold">{pathway.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted">{pathway.description}</p>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                  {pathway.linkText}
                  <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
