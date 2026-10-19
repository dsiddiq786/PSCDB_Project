import { useCatalogue } from "./catalogueContext";
import { formatPkr, formatUsd, totals } from "./pricing";
import { labMeta } from "./labMeta";
import { centreById } from "../Config/institute";

export function LabTag({ lab, className = "" }) {
  const meta = labMeta[lab];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tag} ${className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.short}
    </span>
  );
}

export function CodeTag({ code }) {
  return <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-gold-300">{code}</span>;
}

export function CourseCard({ course, className = "" }) {
  const { rate } = useCatalogue();
  const meta = labMeta[course.lab];
  const pkr = formatPkr(course.feeUsd, rate);

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_24px_48px_-24px_rgba(6,36,27,0.45)] ${className}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-cream-200">
        <img src={course.thumbnail} alt="" width="800" height="450" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <span className={`absolute left-0 top-0 h-1 w-full ${course.lab === "cyber" ? "bg-cyber-600" : "bg-emerald-600"}`} aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className={`text-xs font-semibold ${meta.accentText}`}>
          {meta.short} <span className="text-muted">· {course.code}</span>
        </p>
        <h3 className="mt-2 line-clamp-2 min-h-[3.25rem] font-display text-[17px] font-bold leading-snug text-ink">
          <a href={`/courses/${course.slug}`} className="after:absolute after:inset-0 group-hover:text-emerald-800">{course.title}</a>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{course.summary}</p>
        <p className="mt-4 flex items-center gap-3 text-xs font-medium text-body">
          <span className="inline-flex items-center gap-1.5">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></svg>
            {course.level}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
            {course.duration}
          </span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="tabular font-display text-2xl font-extrabold leading-none text-ink">{formatUsd(course.feeUsd)}</p>
            {pkr && <p className="tabular mt-1 text-xs text-muted">{pkr}</p>}
          </div>
          <p className="text-right text-xs leading-5 text-muted">
            {course.examIncludedByInstitute ? <span className="font-semibold text-emerald-700">Exam fee included</span> : <>+ {formatUsd(course.examFeeUsd)} exam fee</>}
          </p>
        </div>
      </div>
    </article>
  );
}

export function FeePanel({ course }) {
  const { rate } = useCatalogue();
  const t = totals(course);
  const rows = [
    ["Course fee", formatUsd(t.feeUsd), formatPkr(t.feeUsd, rate)],
    ["Professional skills exam", course.examIncludedByInstitute ? "Included" : formatUsd(t.examFeeUsd), course.examIncludedByInstitute ? "Paid by the institute" : formatPkr(t.examFeeUsd, rate)],
  ];

  return (
    <div>
      <dl className="divide-y divide-line">
        {rows.map(([label, usd, pkr]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-3">
            <dt className="text-sm text-body">{label}</dt>
            <dd className="text-right">
              <span className="tabular block text-sm font-semibold text-ink">{usd}</span>
              {pkr && <span className="tabular block text-xs text-muted">{pkr}</span>}
            </dd>
          </div>
        ))}
        <div className="flex items-start justify-between gap-4 py-3">
          <dt className="text-sm font-semibold text-ink">Total</dt>
          <dd className="text-right">
            <span className="tabular block font-display text-2xl font-extrabold text-ink">{formatUsd(t.totalUsd)}</span>
            {formatPkr(t.totalUsd, rate) && <span className="tabular block text-xs text-muted">{formatPkr(t.totalUsd, rate)}</span>}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-xs leading-5 text-muted">Charged in US dollars. Rupee amounts are shown for reference at the current rate.</p>
    </div>
  );
}

export function BatchTable({ course }) {
  const centre = centreById(course.centre, course);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">Batches for {course.title}</caption>
        <thead className="bg-cream-100 text-xs uppercase tracking-[0.1em] text-muted">
          <tr>
            <th scope="col" className="px-5 py-4 font-semibold">Batch</th>
            <th scope="col" className="px-5 py-4 font-semibold">Timing</th>
            <th scope="col" className="px-5 py-4 font-semibold">Centre</th>
            <th scope="col" className="px-5 py-4 font-semibold">Seats available</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {course.batches.map((batch) => (
            <tr key={batch.id}>
              <th scope="row" className="px-5 py-4 font-semibold text-ink">{batch.label}</th>
              <td className="px-5 py-4 text-body">{batch.timing || "Shared on enrollment"}</td>
              <td className="px-5 py-4 text-body">{centre?.name || "To be announced"}</td>
              <td className="px-5 py-4">
                <span className={`tabular font-semibold ${batch.seatsAvailable > 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {batch.seatsAvailable > 0 ? `${batch.seatsAvailable} of ${batch.capacity}` : "Fully booked"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
