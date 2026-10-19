import { useState } from "react";
import { Reveal } from "../../Components/ui";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CertificationSelect, FeeBreakdown, InstituteLogo } from "./CertParts";
import { certName } from "./certFormat";

/* In the course content: the certifications this course is linked to in the admin panel, by institute. */
export function CertificationCoverage({ course }) {
  const { site } = useCatalogue();
  const certs = site.certifications.filter((c) => c.courses.includes(course.slug));
  const institutes = site.institutes.filter((i) => certs.some((c) => c.institute === i.slug));
  if (!certs.length) return null;
  return (
    <Reveal as="section" aria-labelledby="coverage-heading" className="rounded-xl border border-line bg-white p-6 sm:p-8">
      <h2 id="coverage-heading" className="font-display text-2xl font-bold text-ink">Certification Coverage</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        The labs and modules of this course cover objectives from these international certifications. Preparation and the official exams are separate from this course and are booked with each provider.
      </p>
      <ul className="mt-6 divide-y divide-line">
        {institutes.map((inst) => (
          <li key={inst.slug} className="grid gap-3 py-4 sm:grid-cols-[9rem_1fr] sm:items-start">
            <a href={`/certifications?institute=${inst.slug}`} className="flex h-8 items-center">
              <InstituteLogo institute={inst} className="h-6" textClassName="text-sm" />
            </a>
            <ul className="flex flex-wrap gap-2">
              {certs.filter((c) => c.institute === inst.slug).map((c) => (
                <li key={c.slug}>
                  <a href={`/certifications/${c.slug}`} title={c.title} className="inline-flex max-w-full rounded-md border border-line bg-cream-100 px-2.5 py-1 text-xs font-medium text-body transition-colors hover:border-emerald-600 hover:text-emerald-800">
                    <span className="truncate">{c.code || certName(c)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* On a course page: choose an institute, then one of its certifications linked to this course,
   to see the official exam fee next to PSCDB's preparation fee. The course tuition above it is
   separate and never changes here. */
export default function CourseCertifications({ course }) {
  const { site } = useCatalogue();
  const certs = site.certifications.filter((c) => c.courses.includes(course.slug));
  const institutes = site.institutes.filter((i) => certs.some((c) => c.institute === i.slug));
  const [instituteSlug, setInstituteSlug] = useState("");
  const [certSlug, setCertSlug] = useState("");
  if (!certs.length) return null;
  const cert = certs.find((c) => c.slug === certSlug);
  const institute = institutes.find((i) => i.slug === instituteSlug);

  return (
    <div className="mt-6 border-t border-line pt-5">
      <p className="font-display text-base font-bold text-ink">Certification Exam Fees</p>
      <p className="mt-1 text-xs leading-5 text-muted">This course helps you prepare for {certs.length === 1 ? "one international certification" : `${certs.length} international certifications`}. Exams are booked and paid separately with the provider.</p>
      <div className="mt-4">
        <CertificationSelect
          compact
          idPrefix={`course-${course.slug}`}
          institutes={institutes}
          certifications={certs}
          instituteSlug={instituteSlug}
          certSlug={certSlug}
          onInstitute={(value) => {
            setInstituteSlug(value);
            const forInstitute = certs.filter((c) => c.institute === value);
            setCertSlug(forInstitute.length === 1 ? forInstitute[0].slug : "");
          }}
          onCert={setCertSlug}
        />
      </div>
      {cert && (
        <div key={cert.slug} className="nav-flyout-pane mt-4 rounded-lg bg-cream-100 px-4 py-1" aria-live="polite">
          <FeeBreakdown cert={cert} institute={institute} />
          <a href={`/certifications/${cert.slug}`} className="mb-3 inline-flex text-sm font-semibold text-emerald-800 hover:underline">Certification Details →</a>
        </div>
      )}
    </div>
  );
}
