import { Container, PageHeader, Reveal } from "./ui";
import { leadership } from "../Modules/Leadership/leadershipData";

export default function LeadershipPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "About", href: "/about" }, { label: "Leadership" }]}
        eyebrow="Leadership and Governance"
        title="The People Responsible for PSCDB"
        intro="Our leadership sets academic standards, oversees governance and manages the partnerships that give our students access to real-world work."
      />
      <section aria-label="Leadership team" className="bg-cream-100 py-20">
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {leadership.map((person, index) => (
              <Reveal key={person.name} as="li" delay={index * 80}>
                <article className="overflow-hidden rounded-xl border border-line bg-white">
                  <div className="aspect-[4/4.3] overflow-hidden bg-cream-200">
                    <img src={person.image} alt={`Portrait of ${person.name}`} width="800" height="800" loading="lazy" className="h-full w-full object-cover object-top" />
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-lg font-bold text-ink">{person.name}</h2>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">{person.role}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
