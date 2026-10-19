import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroParticles from "./HeroParticles";

const slides = [
  { image: "/images/lab/ai-lab-room.jpg", label: "Advanced AI Lab", href: "/labs/ai", alt: "Illustration of workstations in the Advanced AI Lab" },
  { image: "/images/lab/cyber-lab-room.jpg", label: "Cyber Security Lab", href: "/labs/cyber", alt: "Illustration of monitoring screens in the Cyber Security Lab" },
  { image: "/images/lab/ai-lab-team.jpg", label: "Students in the AI Lab", href: "/labs/ai", alt: "Illustration of students working with language models in the AI Lab" },
  { image: "/images/lab/cyber-lab-team.jpg", label: "Students in the Cyber Lab", href: "/labs/cyber", alt: "Illustration of students investigating a security incident in the Cyber Lab" },
];

const popular = [
  { label: "LLM Fine-Tuning", href: "/courses/llm-engineering-and-fine-tuning" },
  { label: "Penetration Testing", href: "/courses/penetration-testing-professional" },
  { label: "Digital Forensics", href: "/courses/digital-forensics-and-incident-response" },
];

const INTERVAL_MS = 6000;

export default function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const count = slides.length;

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  const submit = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/courses");
  };

  return (
    <section aria-labelledby="hero-heading" className="surface-dark texture-grid relative overflow-hidden">
      <HeroParticles shapes />
      {/* Softens the particles behind the headline so the text stays crisp. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_55%_at_24%_52%,rgba(6,36,27,0.7),transparent_75%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-10 lg:py-24">
        <div>
          <p className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Admissions open for morning and evening batches
          </p>
          <h1 id="hero-heading" style={{ "--delay": "80ms" }} className="rise mt-6 font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]">
            Professional Skills in <span className="text-gold-300">AI and Cyber Security</span>, Taught in Real Labs
          </h1>
          <p style={{ "--delay": "160ms" }} className="rise mt-6 max-w-xl text-lg leading-8 text-white/75">
            On-site courses that end in a professional skills exam. Choose a course, pick a batch and reserve your seat online in minutes.
          </p>

          <form role="search" onSubmit={submit} style={{ "--delay": "240ms" }} className="rise mt-8 flex max-w-xl items-center gap-2 rounded-xl bg-white p-2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
            <label htmlFor="hero-search" className="sr-only">What do you want to learn?</label>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-2 h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>
            <input
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you want to learn?"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
            />
            <button type="submit" className="min-h-11 shrink-0 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800">Search</button>
          </form>

          <div style={{ "--delay": "300ms" }} className="rise mt-5 flex flex-wrap items-center gap-2 text-sm text-white/60">
            <span>Popular:</span>
            {popular.map((item) => (
              <a key={item.href} href={item.href} className="rounded-full border border-white/15 px-3 py-1 text-white/85 transition-colors hover:border-white/40 hover:text-white">{item.label}</a>
            ))}
          </div>

          <div style={{ "--delay": "360ms" }} className="rise mt-10 flex flex-wrap gap-3">
            <a href="/courses" className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 text-sm font-bold text-emerald-950 transition-colors hover:bg-cream-100">Browse All Courses</a>
            <a href="/admissions" className="inline-flex min-h-12 items-center rounded-lg border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:border-white">How Enrollment Works</a>
          </div>
        </div>

        <div
          className="rise relative"
          style={{ "--delay": "150ms" }}
          aria-roledescription="carousel"
          aria-label="Our labs"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="relative aspect-[4/3.3] overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
            {slides.map((slide, slideIndex) => {
              const active = slideIndex === index;
              return (
                <figure
                  key={slide.image}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${slideIndex + 1} of ${count}`}
                  aria-hidden={!active}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-out ${active ? "opacity-100" : "opacity-0"}`}
                >
                  <img src={slide.image} alt={active ? slide.alt : ""} loading={slideIndex === 0 ? "eager" : "lazy"} className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${active ? "scale-105" : "scale-100"}`} />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16">
                    <a href={slide.href} tabIndex={active ? 0 : -1} className="font-display text-lg font-bold text-white hover:underline">{slide.label} →</a>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2" role="tablist" aria-label="Choose image">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.image}
                  type="button"
                  role="tab"
                  aria-selected={slideIndex === index}
                  aria-label={`Show ${slide.label}`}
                  onClick={() => setIndex(slideIndex)}
                  className={`relative h-1.5 overflow-hidden rounded-full bg-white/25 transition-all duration-500 hover:bg-white/50 ${slideIndex === index ? "w-10" : "w-4"}`}
                >
                  {slideIndex === index && (
                    <span
                      key={`${index}-${paused}`}
                      aria-hidden="true"
                      className="dot-fill absolute inset-0 rounded-full bg-gold-400"
                      style={{ "--duration": `${INTERVAL_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIndex((index - 1 + count) % count)} aria-label="Previous image" className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" onClick={() => setIndex((index + 1) % count)} aria-label="Next image" className="grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white hover:bg-white/10">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
