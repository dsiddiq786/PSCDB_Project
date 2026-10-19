import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import AdminIcon from "./AdminIcon";
import { TONES, label } from "../lib/format";

export function Badge({ value, children }) {
  const key = String(value);
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[key] || "bg-slate-100 text-slate-700 ring-slate-500/20"}`}>
      {children ?? label(value)}
    </span>
  );
}

/* AdminLTE-style card: optional coloured top border, header with title and tools. */
export function Card({ title, icon, tools, children, className = "", bodyClassName = "p-5", accent }) {
  const border = { emerald: "border-t-emerald-600", blue: "border-t-cyber-600", gold: "border-t-gold-500", red: "border-t-red-500" }[accent] || "";
  return (
    <section className={`min-w-0 rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${accent ? `border-t-[3px] ${border}` : ""} ${className}`}>
      {(title || tools) && (
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-2.5">
          <h2 className="flex items-center gap-2 font-display text-[15px] font-bold text-slate-800">
            {icon && <AdminIcon name={icon} className="h-4.5 w-4.5 text-slate-400" />}
            {title}
          </h2>
          {tools && <div className="flex flex-wrap items-center gap-2">{tools}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const BUTTONS = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-100",
  gold: "bg-gold-400 text-emerald-950 hover:bg-gold-300 shadow-sm",
};
export function Btn({ variant = "secondary", size = "md", icon, children, className = "", ...rest }) {
  const sizes = { sm: "h-8 px-2.5 text-xs gap-1.5", md: "h-9 px-3.5 text-sm gap-2", lg: "h-11 px-5 text-sm gap-2" };
  return (
    <button type="button" className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${BUTTONS[variant]} ${className}`} {...rest}>
      {icon && <AdminIcon name={icon} className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
      {children}
    </button>
  );
}

export function IconBtn({ icon, label: text, tone = "slate", className = "", ...rest }) {
  const tones = { slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-800", blue: "text-cyber-600 hover:bg-cyber-50", amber: "text-amber-600 hover:bg-amber-50", red: "text-red-600 hover:bg-red-50", green: "text-emerald-700 hover:bg-emerald-50" };
  return (
    <button type="button" title={text} aria-label={text} className={`grid h-8 w-8 place-items-center rounded-md transition-colors disabled:opacity-40 ${tones[tone]} ${className}`} {...rest}>
      <AdminIcon name={icon} className="h-4 w-4" />
    </button>
  );
}

export function Spinner({ className = "h-5 w-5" }) {
  return <span aria-hidden="true" className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

/* Accessible modal: focus moves in, Escape closes, page scroll is locked. */
export function Modal({ open, title, onClose, children, footer, size = "md" }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => ref.current?.querySelector("input, select, textarea, button")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(timer);
      previous?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-[2px] sm:p-8" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`admin-pop my-auto w-full ${widths[size]} rounded-lg bg-white shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 id={titleId} className="font-display text-base font-bold text-slate-800">{title}</h2>
          <IconBtn icon="close" label="Close" onClick={onClose} />
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({ open, title, message, confirmLabel = "Delete", tone = "danger", busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant={tone} onClick={onConfirm} disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />}{confirmLabel}</Btn></>}
    >
      <div className="flex gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}><AdminIcon name="alert" /></span>
        <p className="text-sm leading-6 text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}

export function EmptyState({ icon = "search", title, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><AdminIcon name={icon} className="h-6 w-6" /></span>
      <p className="mt-4 font-semibold text-slate-700">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
    </div>
  );
}

export const inputClass =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100";

/* Same look as inputClass but sized to its content, for toolbars. */
export const compactInput =
  "h-9 w-auto rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-shadow placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100";

export function Field({ label: text, htmlFor, required, hint, error, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {text}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Switch({ checked, onChange, id, label: text }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
      <span className="relative">
        <input id={id} type="checkbox" className="peer sr-only" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
        <span className="block h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600/30" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {text}
    </label>
  );
}

/* AdminLTE "small box": coloured KPI tile with a faded icon and a footer link. */
export function SmallBox({ tone = "emerald", value, label: text, sub, icon, href }) {
  const tones = {
    emerald: "from-emerald-700 to-emerald-800",
    blue: "from-cyber-600 to-cyber-700",
    gold: "from-gold-500 to-gold-600",
    slate: "from-slate-700 to-slate-800",
    red: "from-rose-600 to-rose-700",
  };
  return (
    <div className={`group relative overflow-hidden rounded-lg bg-gradient-to-br text-white shadow-sm ${tones[tone]}`}>
      <div className="relative z-10 px-5 pb-4 pt-5">
        <p className="tabular font-display text-[28px] font-extrabold leading-none">{value}</p>
        <p className="mt-2 text-sm font-medium text-white/90">{text}</p>
        {sub && <p className="mt-0.5 text-xs text-white/70">{sub}</p>}
      </div>
      <AdminIcon name={icon} className="absolute -right-2 top-3 h-20 w-20 text-white/15 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.4} />
      {href && (
        <Link to={href} className="relative z-10 flex items-center justify-center gap-1.5 bg-black/10 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-black/20 hover:text-white">
          More info <AdminIcon name="chevronRight" className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/* AdminLTE "info box": icon square and a value, with an optional progress bar. */
export function InfoBox({ icon, tone = "emerald", label: text, value, progress, note }) {
  const tones = { emerald: "bg-emerald-600", blue: "bg-cyber-600", gold: "bg-gold-500", red: "bg-rose-600", slate: "bg-slate-600" };
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-md text-white shadow-sm ${tones[tone]}`}><AdminIcon name={icon} className="h-7 w-7" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-slate-500">{text}</p>
        <p className="tabular font-display text-lg font-bold text-slate-800">{value}</p>
        {progress !== undefined && (
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
          </div>
        )}
        {note && <p className="mt-1 truncate text-[11px] text-slate-500">{note}</p>}
      </div>
    </div>
  );
}
