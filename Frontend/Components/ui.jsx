import { useEffect, useRef, useState } from "react";

/* Shared UI kit for the public site. */

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

const buttonVariants = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800",
  emerald: "bg-emerald-700 text-white hover:bg-emerald-800",
  gold: "bg-white text-emerald-950 hover:bg-cream-100",
  secondary: "border border-ink/15 bg-white text-ink hover:border-emerald-700 hover:text-emerald-800",
  outlineLight: "border border-ink/15 bg-white text-ink hover:border-emerald-700 hover:text-emerald-800",
  outlineDark: "border border-white/30 text-white hover:border-gold-400 hover:text-gold-300",
  ghost: "text-emerald-800 hover:bg-emerald-50",
};

export function Button({ variant = "primary", href, children, className = "", ...rest }) {
  const classes = `${buttonBase} ${buttonVariants[variant] || buttonVariants.primary} ${className}`;
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

export function Eyebrow({ children, tone = "light", className = "" }) {
  const color = tone === "dark" ? "text-gold-300" : "text-emerald-700";
  return <p className={`text-xs font-bold uppercase tracking-[0.16em] ${color} ${className}`}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, children, tone = "light", align = "left", id }) {
  const isDark = tone === "dark";
  const alignment = align === "center" ? "mx-auto items-center text-center" : "";
  return (
    <div className={`flex max-w-3xl flex-col gap-4 ${alignment}`}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2 id={id} className={`font-display text-3xl font-bold leading-tight sm:text-4xl ${isDark ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
      {children && <p className={`text-base leading-7 sm:text-lg ${isDark ? "text-white/70" : "text-muted"}`}>{children}</p>}
    </div>
  );
}

/* Standard top band for every inner page: breadcrumb, title, intro and an optional image. */
export function PageHeader({ eyebrow, title, intro, crumbs = [], image, imageAlt = "", illustrative = false, children, id = "page-heading" }) {
  return (
    <section aria-labelledby={id} className="surface-dark texture-grid relative overflow-hidden">
      <Container className={`grid gap-10 py-14 sm:py-20 ${image ? "lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : ""}`}>
        <div className="rise">
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/60">
              <ol className="flex flex-wrap items-center gap-2">
                <li><a href="/" className="hover:text-white">Home</a></li>
                {crumbs.map((crumb) => (
                  <li key={crumb.label} className="flex items-center gap-2">
                    <span aria-hidden="true">/</span>
                    {crumb.href ? <a href={crumb.href} className="hover:text-white">{crumb.label}</a> : <span className="text-white/90">{crumb.label}</span>}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {eyebrow && <Eyebrow tone="dark">{eyebrow}</Eyebrow>}
          <h1 id={id} className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl">{title}</h1>
          {intro && <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{intro}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
        {image && (
          <figure className="rise relative overflow-hidden rounded-xl ring-1 ring-white/10" style={{ "--delay": "120ms" }}>
            <img src={image} alt={imageAlt} className="aspect-[4/3] w-full object-cover" />
            {illustrative && <IllustrativeTag />}
          </figure>
        )}
      </Container>
    </section>
  );
}

export function IllustrativeTag() {
  return (
    <figcaption className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 text-[11px] font-medium text-white/85">
      Illustrative image
    </figcaption>
  );
}

/* Reveals children on scroll. Content stays visible when JavaScript is unavailable. */
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => typeof window !== "undefined" && !("IntersectionObserver" in window));

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <Tag ref={ref} data-reveal className={`${inView ? "is-in" : ""} ${className}`} style={{ "--delay": `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>;
}
