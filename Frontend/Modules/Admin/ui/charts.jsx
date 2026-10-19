import { useState } from "react";

/* Small, dependency-free SVG charts for the dashboard. */

const niceMax = (value) => {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value / 4) * power;
  return Math.ceil(value / step) * step;
};

/* Revenue as an area line, enrolments as bars, sharing one time axis. */
export function RevenueChart({ data, formatMoney }) {
  const [hover, setHover] = useState(null);
  const width = 720;
  const height = 260;
  const pad = { top: 16, right: 44, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxRevenue = niceMax(Math.max(...data.map((d) => d.revenueUsd), 0));
  const maxCount = niceMax(Math.max(...data.map((d) => d.enrolments), 0));
  const step = innerW / Math.max(data.length - 1, 1);
  const x = (i) => pad.left + i * step;
  const yRevenue = (v) => pad.top + innerH - (v / maxRevenue) * innerH;
  const yCount = (v) => pad.top + innerH - (v / maxCount) * innerH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yRevenue(d.revenueUsd).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const barWidth = Math.max(step * 0.5, 3);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Revenue and enrolments over the last 30 days" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#128058" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#128058" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH * (1 - t)} y2={pad.top + innerH * (1 - t)} stroke="#e2e8f0" strokeDasharray={t ? "3 4" : undefined} />
            <text x={pad.left - 8} y={pad.top + innerH * (1 - t) + 4} textAnchor="end" className="fill-slate-400 text-[10px]">{formatMoney(maxRevenue * t)}</text>
            <text x={width - pad.right + 8} y={pad.top + innerH * (1 - t) + 4} className="fill-slate-400 text-[10px]">{Math.round(maxCount * t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <rect key={d.date} x={x(i) - barWidth / 2} y={yCount(d.enrolments)} width={barWidth} height={pad.top + innerH - yCount(d.enrolments)} rx="1.5" className={hover === i ? "fill-gold-400" : "fill-gold-300/70"} />
        ))}
        <path d={area} fill="url(#revenue-fill)" />
        <path d={line} fill="none" stroke="#128058" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % 5 === 0 || i === data.length - 1 ? (
            <text key={d.date} x={x(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[10px]">
              {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </text>
          ) : null,
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={yRevenue(data[hover].revenueUsd)} r="4.5" fill="#fff" stroke="#128058" strokeWidth="2.2" />
          </g>
        )}
        {data.map((d, i) => (
          <rect key={`hit-${d.date}`} x={x(i) - step / 2} y={pad.top} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `${(x(hover) / width) * 100}%`, transform: `translateX(${x(hover) > width * 0.7 ? "-105%" : "8px"})` }}
        >
          <p className="font-semibold">{new Date(`${data[hover].date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}</p>
          <p className="mt-0.5 text-emerald-300">Revenue {formatMoney(data[hover].revenueUsd)}</p>
          <p className="text-gold-300">Enrolments {data[hover].enrolments}</p>
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-emerald-600" /> Revenue (USD)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-300" /> Paid enrolments</span>
      </div>
    </div>
  );
}

/* Doughnut chart with a centre total and a legend. */
export function Donut({ segments, centreLabel = "Total", size = 168 }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")} className="shrink-0 -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="20" />
        {total > 0 &&
          segments.map((s, i) => {
            const length = (s.value / total) * circumference;
            const el = (
              <circle
                key={s.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === i ? 24 : 20}
                strokeDasharray={`${Math.max(length - 1.5, 0)} ${circumference}`}
                strokeDashoffset={-offset}
                className="transition-[stroke-width] duration-200"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
            offset += length;
            return el;
          })}
        <g className="rotate-90" style={{ transformOrigin: "80px 80px" }}>
          <text x="80" y="78" textAnchor="middle" className="fill-slate-800 font-display text-[26px] font-extrabold">{hover !== null ? segments[hover].value : total}</text>
          <text x="80" y="97" textAnchor="middle" className="fill-slate-400 text-[10px]">{hover !== null ? segments[hover].label : centreLabel}</text>
        </g>
      </svg>
      <ul className="grid w-full max-w-[14rem] gap-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
            <span className="tabular font-semibold text-slate-800">{s.value}{total ? <span className="ml-1.5 text-xs font-normal text-slate-400">{Math.round((s.value / total) * 100)}%</span> : null}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Progress({ value, max, tone = "bg-emerald-600" }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={`h-full rounded-full transition-[width] duration-700 ${pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
