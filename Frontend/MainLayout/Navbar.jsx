import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { institute } from "../Modules/Config/institute";

const navLinks = [
  { label: "Courses", href: "/programmes" },
  { label: "AI Lab", href: "/labs/ai" },
  { label: "Cyber Lab", href: "/labs/cyber" },
  { label: "Admissions", href: "/admissions" },
  { label: "Fees", href: "/payments" },
  { label: "About", href: "/about" },
];

function SearchIcon({ className = "h-5 w-5" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export default function Navbar() {
  const [openPath, setOpenPath] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  // The mobile menu belongs to the page it was opened on, so navigating closes it.
  const open = openPath === pathname;
  const setOpen = (value) => setOpenPath(value ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpenPath(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="hidden bg-emerald-950 text-[13px] text-white/75 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <p>Onsite courses in AI and cyber security · Sahiwal, Pakistan</p>
          <div className="flex items-center gap-5">
            <a href={`mailto:${institute.email}`} className="hover:text-white">{institute.email}</a>
            <a href="/contact" className="hover:text-white">Contact</a>
            <a href={institute.lmsUrl} className="inline-flex items-center gap-1.5 font-semibold text-gold-300 hover:text-gold-200">
              Student login
              <span className="sr-only">(opens the learning platform)</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 w-full border-b bg-white transition-shadow duration-300 ${scrolled ? "border-line shadow-[0_6px_20px_-14px_rgba(6,36,27,0.35)]" : "border-line"}`}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-5 sm:px-8 lg:px-10">
          <a href="/" className="flex shrink-0 items-center gap-3" aria-label="PSCDB home">
            <img src="/brand/crest-768.png" alt="" width="48" height="48" className="h-12 w-12 object-contain" />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-extrabold tracking-tight text-ink">PSCDB</span>
              <span className="hidden text-[11px] font-medium text-muted lg:block">Professional Skills and Community Development Board</span>
            </span>
          </a>

          <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-[17px] after:h-0.5 after:origin-center after:rounded-full after:bg-emerald-700 after:transition-transform after:duration-300 ${
                  isActive(link.href) ? "text-emerald-800 after:scale-x-100" : "text-body after:scale-x-0 hover:text-emerald-800 hover:after:scale-x-100"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-2">
            <a href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-cream-100">
              <SearchIcon />
            </a>
            <a href="/programmes" className="hidden min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:inline-flex">
              Enrol now
            </a>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-cream-100 xl:hidden"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white xl:hidden">
            <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
              {[...navLinks, { label: "Careers", href: "/careers" }, { label: "Leadership", href: "/leadership" }, { label: "Contact", href: "/contact" }].map((link) => (
                <a key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className="border-b border-line py-4 text-lg font-semibold text-ink">
                  {link.label}
                </a>
              ))}
              <a href={institute.lmsUrl} className="border-b border-line py-4 text-lg font-semibold text-emerald-800">Student login (LMS)</a>
              <a href="/programmes" className="mt-8 rounded-lg bg-emerald-700 py-3.5 text-center text-sm font-semibold text-white">Enrol now</a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
