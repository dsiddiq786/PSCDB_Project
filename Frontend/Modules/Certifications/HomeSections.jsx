import { Container, Reveal, SectionHeading } from "../../Components/ui";
import { Icon } from "../../Components/icons";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CertificationCard, InstituteLogo } from "./CertParts";

/* Homepage: a quiet row of certification provider logos. Text, visibility, logo size, opacity
   and grayscale all come from the "home_institutes" section in the admin panel. */
export function InstitutesStrip() {
  const { site } = useCatalogue();
  const section = site.sections.home_institutes;
  const institutes = site.institutes.filter((i) => i.showInStrip).slice(0, section?.maxItems || 14);
  if (!section?.visible || !institutes.length) return null;
  const style = {
    "--logo-h": `${section.logoHeight || 30}px`,
    "--logo-o": (section.logoOpacity ?? 55) / 100,
  };
  return (
    <section aria-labelledby="institutes-heading" className="border-y border-line bg-cream-100 py-16 sm:py-20" style={style}>
      <Container>
        <Reveal>
          <SectionHeading id="institutes-heading" eyebrow={section.eyebrow} title={section.title} align="center">{section.subtitle}</SectionHeading>
        </Reveal>
        <Reveal delay={100}>
          <ul className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
            {institutes.map((inst) => (
              <li key={inst.slug}>
                <a
                  href={`/certifications?institute=${inst.slug}`}
                  aria-label={`${inst.shortName || inst.name} certifications`}
                  className={`institute-logo flex h-[calc(var(--logo-h)_+_16px)] items-center rounded-md px-2 ${section.grayscale ? "is-gray" : ""}`}
                >
                  <InstituteLogo institute={inst} className="h-[var(--logo-h)]" textClassName="text-lg" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          {section.ctaLabel && section.ctaHref && (
            <a href={section.ctaHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:border-emerald-700">
              {section.ctaLabel} <Icon name="arrow" className="h-4 w-4" />
            </a>
          )}
          {section.body && <p className="max-w-2xl text-xs leading-5 text-muted">{section.body}</p>}
        </div>
      </Container>
    </section>
  );
}

/* Homepage: featured certification cards, in the same style as the course cards. */
export function FeaturedCertifications() {
  const { site } = useCatalogue();
  const section = site.sections.home_featured_certifications;
  const institutes = new Map(site.institutes.map((i) => [i.slug, i]));
  const certs = site.certifications.filter((c) => c.featured && institutes.has(c.institute)).sort((a, b) => a.order - b.order).slice(0, section?.maxItems || 6);
  if (!section?.visible || !certs.length) return null;
  return (
    <section aria-labelledby="featured-certs-heading" className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <Reveal><SectionHeading id="featured-certs-heading" eyebrow={section.eyebrow} title={section.title}>{section.subtitle}</SectionHeading></Reveal>
          {section.ctaLabel && section.ctaHref && (
            <a href={section.ctaHref} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:underline">{section.ctaLabel} <Icon name="arrow" className="h-4 w-4" /></a>
          )}
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((cert, index) => (
            <Reveal as="li" key={cert.slug} delay={Math.min(index, 5) * 70}><CertificationCard cert={cert} institute={institutes.get(cert.institute)} /></Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
