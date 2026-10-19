import { useMemo, useState } from "react";
import { Icon } from "../../Components/icons";
import { useCatalogue } from "../Catalogue/catalogueContext";
import { formatPkr } from "../Catalogue/pricing";
import { categoryLabel, certName, money, verifiedLabel } from "./certFormat";

/* Shared parts for certifications: logos, cards, the three fees, the selector and the disclaimer. */

export function InstituteLogo({ institute, className = "h-8", textClassName = "text-sm" }) {
  // Some logo files are only a symbol (for example a cloud); then the name is shown beside it.
  const [iconOnly, setIconOnly] = useState(false);
  if (institute?.logoUrl) {
    const img = <img src={institute.logoUrl} alt={iconOnly ? "" : `${institute.name} logo`} onLoad={(e) => setIconOnly(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight < 1.6)} className={`${className} w-auto max-w-full object-contain`} loading="lazy" />;
    if (!iconOnly) return img;
    return <span className="inline-flex items-center gap-2">{img}<span className={`font-display font-bold tracking-tight text-ink ${textClassName}`}>{institute.shortName || institute.name}</span></span>;
  }
  // Without a logo, the institute's name is shown as a plain wordmark.
  return <span className={`font-display font-extrabold tracking-tight text-ink ${textClassName}`}>{institute?.shortName || institute?.name}</span>;
}

export function CategoryTag({ category }) {
  const ai = category === "ai_ml";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${ai ? "bg-emerald-50 text-emerald-800 ring-emerald-700/15" : "bg-cyber-50 text-cyber-700 ring-cyber-600/15"}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${ai ? "bg-emerald-600" : "bg-cyber-600"}`} />
      {categoryLabel(category)}
    </span>
  );
}

/* The official exam fee as published, or a clear note when the provider does not publish it. */
export function ExamFee({ cert, institute, compact = false }) {
  const fee = cert.examFee;
  const amount = money(fee.amount, fee.currency);
  if (!amount) return <span className="text-sm text-muted">{compact ? "Not published" : `Not published separately by ${institute?.shortName || "the provider"}`}</span>;
  return <span className="tabular font-semibold text-ink">{amount}</span>;
}

/* Card in the style of the course cards: logo band, category bar, title, level and both fees. */
export function CertificationCard({ cert, institute }) {
  const { rate } = useCatalogue();
  const prep = money(cert.prepFeeUsd, "USD");
  const ai = cert.category === "ai_ml";
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_48px_-24px_rgba(6,36,27,0.45)]">
      <div className="relative grid aspect-[16/7] place-items-center bg-cream-100 px-8">
        <span className={`absolute left-0 top-0 h-1 w-full ${ai ? "bg-emerald-600" : "bg-cyber-600"}`} aria-hidden="true" />
        <InstituteLogo institute={institute} className="h-10 transition-transform duration-500 group-hover:scale-105" textClassName="text-xl" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className={`text-xs font-semibold ${ai ? "text-emerald-700" : "text-cyber-700"}`}>
          {institute?.shortName || institute?.name}
          {cert.code && <span className="text-muted"> · {cert.code}</span>}
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-[3.25rem] font-display text-[17px] font-bold leading-snug text-ink">
          <a href={`/certifications/${cert.slug}`} className="after:absolute after:inset-0 group-hover:text-emerald-800">{cert.title}</a>
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CategoryTag category={cert.category} />
          {cert.level && <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-body">{cert.level}</span>}
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">PSCDB Preparation</dt>
            <dd className="mt-1">
              {prep ? <span className="tabular font-display text-xl font-extrabold text-ink">{prep}</span> : <span className="text-sm text-muted">To Be Announced</span>}
              {prep && rate && <span className="tabular block text-[11px] text-muted">{formatPkr(cert.prepFeeUsd, rate)}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Official Exam</dt>
            <dd className="mt-1 text-sm"><ExamFee cert={cert} institute={institute} compact /></dd>
            <dd className="text-[11px] text-muted">Paid to the provider</dd>
          </div>
        </dl>
        <span className="relative z-10 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
          View Details <Icon name="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}

/* Side-by-side explanation of the fees for one certification. */
export function FeeBreakdown({ cert, institute, course }) {
  const { rate } = useCatalogue();
  const fee = cert.examFee;
  const examAmount = money(fee.amount, fee.currency);
  const prep = money(cert.prepFeeUsd, "USD");
  return (
    <dl className="divide-y divide-line">
      {course && (
        <div className="py-3">
          <dt className="text-sm text-body">PSCDB Course Fee <span className="text-muted">({course.code})</span></dt>
          <dd className="tabular mt-0.5 font-semibold text-ink">{money(course.feeUsd, "USD")}</dd>
          <dd className="text-xs text-muted">Tuition for the course itself, unchanged by any certification.</dd>
        </div>
      )}
      <div className="py-3">
        <dt className="text-sm text-body">PSCDB Certification Preparation</dt>
        <dd className="mt-0.5">
          {prep ? <span className="tabular font-display text-2xl font-extrabold text-ink">{prep}</span> : <span className="text-sm text-muted">To Be Announced</span>}
          {prep && rate && <span className="tabular ml-2 text-xs text-muted">{formatPkr(cert.prepFeeUsd, rate)}</span>}
        </dd>
        <dd className="text-xs leading-5 text-muted">
          Hands-on training and labs at PSCDB. {cert.prepIncludesExam ? "This fee includes the exam registration." : "It does not include the official exam."}
        </dd>
      </div>
      <div className="py-3">
        <dt className="text-sm text-body">Official Exam Fee</dt>
        <dd className="mt-0.5">
          {examAmount ? <span className="tabular font-display text-2xl font-extrabold text-ink">{examAmount}</span> : <span className="text-sm font-semibold text-ink">Not published separately</span>}
          {examAmount && <span className="ml-2 text-xs text-muted">{fee.currency}</span>}
        </dd>
        <dd className="text-xs leading-5 text-muted">
          Paid directly to {institute?.name || "the provider"}{fee.region ? `, ${fee.region} price` : ""}.
          {fee.verifiedAt ? ` Verified ${verifiedLabel(fee.verifiedAt)}.` : ""} Fees may change.
        </dd>
        {fee.notes && <dd className="mt-1 text-xs leading-5 text-muted">{fee.notes}</dd>}
        {fee.sourceUrl && (
          <dd className="mt-1">
            <a href={fee.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline">
              Official Fee Source <span className="sr-only">(opens in a new tab)</span>↗
            </a>
          </dd>
        )}
      </div>
    </dl>
  );
}

/* Two dependent drop-downs: institute, then certification. Only lists what it is given. */
export function CertificationSelect({ institutes, certifications, instituteSlug, certSlug, onInstitute, onCert, idPrefix = "cert", compact = false }) {
  const forInstitute = useMemo(() => certifications.filter((c) => c.institute === instituteSlug), [certifications, instituteSlug]);
  const selectClass = `w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${compact ? "h-10" : "h-12"}`;
  return (
    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      <div>
        <label htmlFor={`${idPrefix}-institute`} className="mb-1.5 block text-sm font-semibold text-ink">Select Institute</label>
        <select id={`${idPrefix}-institute`} value={instituteSlug} onChange={(e) => onInstitute(e.target.value)} className={selectClass}>
          <option value="">Choose an institute…</option>
          {institutes.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-certification`} className="mb-1.5 block text-sm font-semibold text-ink">Select Certification</label>
        <select id={`${idPrefix}-certification`} value={certSlug} onChange={(e) => onCert(e.target.value)} disabled={!instituteSlug} className={`${selectClass} disabled:bg-cream-100 disabled:text-muted`}>
          <option value="">{instituteSlug ? "Choose a certification…" : "Choose an institute first"}</option>
          {forInstitute.map((c) => <option key={c.slug} value={c.slug}>{certName(c)}</option>)}
        </select>
      </div>
    </div>
  );
}

/* The admin-editable statement and disclaimer. */
export function CertificationDisclaimer({ className = "" }) {
  const { site } = useCatalogue();
  const d = site.sections.certification_disclaimer;
  if (!d || !d.visible) return null;
  return (
    <section aria-labelledby="cert-disclaimer" className={`rounded-xl border border-gold-300 bg-gold-50 p-6 sm:p-8 ${className}`}>
      <h2 id="cert-disclaimer" className="font-display text-xl font-bold text-ink">{d.title}</h2>
      {d.body && <p className="mt-3 text-sm leading-7 text-body">{d.body}</p>}
      {d.bullets?.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {d.bullets.map((b) => (
            <li key={b} className="flex gap-2.5 text-sm leading-6 text-body"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />{b}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
