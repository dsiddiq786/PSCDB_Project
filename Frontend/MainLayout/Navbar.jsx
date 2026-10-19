import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { institute } from "../Modules/Config/institute";
import { useCatalogue } from "../Modules/Catalogue/catalogueContext";
import NavFlyout from "./NavFlyout";
import { buildMenu, itemMatches } from "./menuData";

/* Mobile menu: each item with groups expands in place; each group expands to its children. */
function MobileItem({ item, active }) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  if (!item.groups.length) {
    return <a href={item.href} aria-current={active ? "page" : undefined} className="block border-b border-line py-4 text-lg font-semibold text-ink">{item.label}</a>;
  }
  return (
    <div className="border-b border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left text-lg font-semibold text-ink">
        {item.label}
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 text-muted transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="nav-flyout-pane pb-3">
          <a href={item.href} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-800">{item.footer?.label || `All ${item.label}`} →</a>
          {item.groups.map((g) =>
            g.children?.length ? (
              <div key={g.key}>
                <button type="button" aria-expanded={openGroup === g.key} onClick={() => setOpenGroup(openGroup === g.key ? null : g.key)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink hover:bg-cream-100">
                  {g.logo && <img src={g.logo} alt="" className="h-5 w-7 object-contain" loading="lazy" />}
                  <span className="flex-1">{g.label}</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 text-muted transition-transform duration-200 motion-reduce:transition-none ${openGroup === g.key ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
                </button>
                {openGroup === g.key && (
                  <div className="nav-flyout-pane ml-5 border-l border-line pl-3">
                    {g.children.map((c) => (
                      <a key={c.href} href={c.href} className="block rounded-lg px-3 py-2 text-sm text-body hover:text-emerald-800">{c.label}</a>
                    ))}
                    <a href={g.href} className="block px-3 py-2 text-sm font-semibold text-emerald-800">{g.viewLabel || `View ${g.label}`} →</a>
                  </div>
                )}
              </div>
            ) : (
              <a key={g.key} href={g.href} className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink">{g.label}</a>
            ),
          )}
        </div>
      )}
    </div>
  );
}

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
  const { site } = useCatalogue();
  const menu = useMemo(() => buildMenu(site), [site]);

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
          <p>On-Site Courses in AI and Cyber Security · Sahiwal, Pakistan</p>
          <div className="flex items-center gap-5">
            <a href={`mailto:${institute.email}`} className="hover:text-white">{institute.email}</a>
            <a href="/contact" className="hover:text-white">Contact</a>
            {institute.lmsUrl && <a href={institute.lmsUrl} className="inline-flex items-center gap-1.5 font-semibold text-gold-300 hover:text-gold-200">
              Student Login
              <span className="sr-only">(opens the learning platform)</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </a>}
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
            {menu.map((item) =>
              item.groups.length ? (
                <NavFlyout key={item.label} label={item.label} href={item.href} groups={item.groups} footer={item.footer} active={itemMatches(item, pathname)} />
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={itemMatches(item, pathname) ? "page" : undefined}
                  className={`relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-[17px] after:h-0.5 after:origin-center after:rounded-full after:bg-emerald-700 after:transition-transform after:duration-300 ${
                    itemMatches(item, pathname) ? "text-emerald-800 after:scale-x-100" : "text-body after:scale-x-0 hover:text-emerald-800 hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-2">
            <a href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-cream-100">
              <SearchIcon />
            </a>
            <a href="/courses" className="hidden min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:inline-flex">
              Enroll Now
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
              {menu.map((item) => <MobileItem key={item.label} item={item} active={itemMatches(item, pathname)} />)}
              {[{ label: "Careers", href: "/careers" }, { label: "Leadership", href: "/leadership" }, { label: "Contact", href: "/contact" }].map((link) => (
                <a key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className="border-b border-line py-4 text-lg font-semibold text-ink">
                  {link.label}
                </a>
              ))}
              {institute.lmsUrl && <a href={institute.lmsUrl} className="border-b border-line py-4 text-lg font-semibold text-emerald-800">Student Login (LMS)</a>}
              <a href="/courses" className="mt-8 rounded-lg bg-emerald-700 py-3.5 text-center text-sm font-semibold text-white">Enroll Now</a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
