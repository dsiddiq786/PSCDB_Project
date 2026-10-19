import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../Api/client";
import { Container, PageHeader, Reveal } from "../../Components/ui";
import { Icon } from "../../Components/icons";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { CategoryTag, CertificationCard, CertificationDisclaimer, CertificationSelect, FeeBreakdown, InstituteLogo } from "./CertParts";
import { money } from "./certFormat";

/* /certifications                     all certifications, filterable by category
   /certifications?institute=microsoft one institute and its certifications
   /certifications/<slug>              one certification in full
   Everything shown comes from the database through the API. */

const CATEGORIES = [
  ["", "All"],
  ["ai_ml", "AI/ML"],
  ["cybersecurity", "Cybersecurity"],
];

function Block({ title, icon, children }) {
  return (
    <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
      <h3 className="flex items-center gap-2.5 font-display text-xl font-bold text-ink">
        {icon && <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon name={icon} className="h-5 w-5" /></span>}
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Detail({ slug }) {
  const [state, setState] = useState({ slug: null, data: null, error: "" });
  useEffect(() => {
    const controller = new AbortController();
    api(`/certifications/${slug}`, { signal: controller.signal }).then((r) => {
      if (r.aborted) return;
      setState({ slug, data: r.ok ? r.data : null, error: r.ok ? "" : r.message || "This certification could not be found." });
    });
    return () => controller.abort();
  }, [slug]);

  if (state.slug !== slug) return <div className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className="skeleton h-96 rounded-xl" /><div className="skeleton h-80 rounded-xl" /></div>;
  if (!state.data) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-10 text-center">
        <h2 className="font-display text-xl font-bold text-ink">Certification Not Found</h2>
        <p className="mt-2 text-sm text-muted">{state.error}</p>
        <a href="/certifications" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800">View All Certifications</a>
      </div>
    );
  }

  const c = state.data;
  const inst = c.institute;
  const exam = c.exam || {};
  const examFacts = [
    ["Format", exam.format],
    ["Questions", exam.questions],
    ["Length", exam.durationMinutes ? `${exam.durationMinutes} minutes` : ""],
    ["Passing Score", exam.passingScore],
    ["Languages", exam.languages],
    ["Delivery", exam.delivery],
  ].filter(([, v]) => v);
  const firstCourse = c.relatedCourses[0];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid min-w-0 gap-6">
        <Reveal as="section" className="rounded-xl border border-line bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <InstituteLogo institute={inst} className="h-10" textClassName="text-xl" />
            <div className="flex flex-wrap gap-2"><CategoryTag category={c.category} />{c.level && <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-body">{c.level}</span>}</div>
          </div>
          <p className="mt-6 text-sm font-semibold text-emerald-700">{inst.name}{c.code && <span className="text-muted"> · {c.code}</span>}</p>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight text-ink">{c.title}</h2>
          {c.description && <p className="mt-4 text-base leading-7 text-body">{c.description}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {c.officialUrl && <a href={c.officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-5 text-sm font-semibold text-ink hover:border-emerald-700">Official Certification Page <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span></a>}
            {inst.website && <a href={inst.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-emerald-800 hover:underline">{inst.shortName || inst.name} Website <span aria-hidden="true">↗</span></a>}
          </div>
        </Reveal>

        {c.objectives.length > 0 && (
          <Reveal><Block title="Official Exam Objectives" icon="checkCircle">
            <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line">
              {c.objectives.map((o, i) => (
                <li key={o.title} className="flex items-center gap-4 px-4 py-3">
                  <span className="tabular font-mono text-xs font-semibold text-emerald-700">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-sm text-ink">{o.title}</span>
                  {o.weight && <span className="tabular shrink-0 rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-semibold text-body">{o.weight}</span>}
                </li>
              ))}
            </ol>
          </Block></Reveal>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {c.prerequisites.length > 0 && (
            <Reveal><Block title="Prerequisites" icon="book">
              <ul className="grid gap-2.5">{c.prerequisites.map((p) => <li key={p} className="flex gap-3 text-sm leading-6 text-body"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />{p}</li>)}</ul>
            </Block></Reveal>
          )}
          {examFacts.length > 0 && (
            <Reveal><Block title="Exam Details" icon="clock">
              <dl className="grid gap-3">{examFacts.map(([k, v]) => <div key={k}><dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{k}</dt><dd className="text-sm text-ink">{v}</dd></div>)}</dl>
            </Block></Reveal>
          )}
        </div>

        {(c.labs.length > 0 || c.curriculum.length > 0 || c.prepDuration) && (
          <Reveal><Block title="PSCDB Hands-On Preparation" icon="layers">
            {c.prepDuration && <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"><Icon name="clock" className="h-4 w-4" /> Training Duration: {c.prepDuration}</p>}
            <div className="mt-5 grid gap-8 md:grid-cols-2">
              {c.labs.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-ink">Practical Labs</h4>
                  <ul className="mt-3 grid gap-2.5">{c.labs.map((l) => <li key={l} className="flex gap-3 text-sm leading-6 text-body"><span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">✓</span>{l}</li>)}</ul>
                </div>
              )}
              {c.curriculum.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-ink">Preparation Curriculum</h4>
                  <ol className="mt-3 grid gap-2.5">{c.curriculum.map((step, i) => <li key={step} className="flex gap-3 text-sm leading-6 text-body"><span className="tabular font-mono text-xs font-semibold text-emerald-700">{String(i + 1).padStart(2, "0")}</span>{step}</li>)}</ol>
                </div>
              )}
            </div>
          </Block></Reveal>
        )}

        {c.relatedCourses.length > 0 && (
          <Reveal><Block title="Related PSCDB Courses" icon="courses">
            <ul className="grid gap-3 sm:grid-cols-2">
              {c.relatedCourses.map((course) => (
                <li key={course.slug}>
                  <a href={`/courses/${course.slug}`} className="group flex h-full flex-col rounded-lg border border-line p-4 transition-colors hover:border-emerald-700/40 hover:bg-emerald-50/40">
                    <span className="font-mono text-[11px] font-semibold text-muted">{course.code}</span>
                    <span className="mt-1 font-semibold text-ink group-hover:text-emerald-800">{course.title}</span>
                    <span className="mt-1 text-xs text-muted">{course.level} · {course.duration} · Course fee {money(course.feeUsd, "USD")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Block></Reveal>
        )}
      </div>

      <aside aria-label="Fees and enrollment" className="min-w-0 lg:sticky lg:top-24">
        <div className="rounded-xl border border-line bg-white p-6 shadow-[0_20px_40px_-28px_rgba(6,36,27,0.45)]">
          <h3 className="font-display text-lg font-bold text-ink">Fees</h3>
          <div className="mt-2"><FeeBreakdown cert={c} institute={inst} /></div>
          <div className="mt-5 grid gap-3">
            {firstCourse && <a href={`/enroll/${firstCourse.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800">Enroll in {firstCourse.code}</a>}
            <a href="/contact?topic=admission" className={`inline-flex min-h-12 items-center justify-center rounded-lg px-6 text-sm font-semibold ${firstCourse ? "border border-line text-ink hover:border-emerald-700" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>Ask About Preparation</a>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">You register and pay for the official exam with {inst.name}. PSCDB does not sell exam vouchers{c.prepIncludesExam ? " except where stated above" : ""}.</p>
        </div>
      </aside>
    </div>
  );
}

export default function CertificationsPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { site, siteStatus } = useCatalogue();
  const section = site.sections.certifications_page || {};
  const institutes = site.institutes.filter((i) => site.certifications.some((c) => c.institute === i.slug));
  const instituteMap = useMemo(() => new Map(site.institutes.map((i) => [i.slug, i])), [site.institutes]);
  const current = slug ? site.certifications.find((c) => c.slug === slug) : null;
  const instituteSlug = current?.institute || params.get("institute") || "";
  const institute = instituteMap.get(instituteSlug);
  const category = params.get("category") || "";

  const list = site.certifications.filter((c) => instituteMap.has(c.institute) && (!instituteSlug || c.institute === instituteSlug) && (!category || c.category === category));

  const chooseInstitute = (value) => navigate(value ? `/certifications?institute=${value}` : "/certifications");
  const chooseCert = (value) => navigate(value ? `/certifications/${value}` : `/certifications?institute=${instituteSlug}`);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Certifications", href: slug || instituteSlug ? "/certifications" : undefined }, ...(institute ? [{ label: institute.name, href: slug ? `/certifications?institute=${institute.slug}` : undefined }] : []), ...(current ? [{ label: current.code || current.title }] : [])]}
        eyebrow={section.eyebrow || "Certifications"}
        title={section.title || "International Certification Preparation"}
        intro={section.subtitle}
      />

      <div className="bg-cream-100">
        <Container className="relative -top-8 sm:-top-10">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_24px_48px_-32px_rgba(6,36,27,0.45)] sm:p-6">
            <CertificationSelect institutes={institutes} certifications={site.certifications} instituteSlug={instituteSlug} certSlug={slug || ""} onInstitute={chooseInstitute} onCert={chooseCert} />
          </div>
        </Container>

        <Container className="pb-20 pt-2">
          {slug ? (
            <Detail key={slug} slug={slug} />
          ) : (
            <>
              {institute && (
                <Reveal as="section" className="mb-8 flex flex-col gap-5 rounded-xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:p-8">
                  <div className="grid h-20 w-40 shrink-0 place-items-center rounded-lg bg-cream-100 px-4"><InstituteLogo institute={institute} className="h-10" textClassName="text-xl" /></div>
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-bold text-ink">{institute.name}</h2>
                    {institute.description && <p className="mt-2 text-sm leading-6 text-body">{institute.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      {institute.website && <a href={institute.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 hover:underline">Official Website ↗</a>}
                      {institute.partnershipVerified && <span className="font-semibold text-gold-600">Verified Partner{institute.partnershipNote ? `: ${institute.partnershipNote}` : ""}</span>}
                    </div>
                  </div>
                </Reveal>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-body" aria-live="polite"><span className="font-semibold text-ink">{list.length}</span> {list.length === 1 ? "certification" : "certifications"}{institute ? ` from ${institute.name}` : ""}</p>
                <div role="group" aria-label="Filter by category" className="inline-flex rounded-full border border-line bg-white p-1">
                  {CATEGORIES.map(([value, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={category === value}
                      onClick={() => {
                        const next = new URLSearchParams(params);
                        if (value) next.set("category", value);
                        else next.delete("category");
                        navigate(`/certifications${next.toString() ? `?${next}` : ""}`, { replace: true });
                      }}
                      className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${category === value ? "bg-emerald-950 text-white" : "text-body hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {siteStatus === "loading" ? (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-80 rounded-xl" />)}</div>
              ) : list.length ? (
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((cert, index) => (
                    <Reveal as="li" key={cert.slug} delay={Math.min(index, 5) * 50}><CertificationCard cert={cert} institute={instituteMap.get(cert.institute)} /></Reveal>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No certifications match this selection.</div>
              )}
            </>
          )}
          <CertificationDisclaimer className="mt-12" />
        </Container>
      </div>
    </>
  );
}
