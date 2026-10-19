import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

/* Internal links open instantly without reloading the page. External links,
   downloads, new tabs, modifier clicks and API paths keep normal browser behaviour. */
function useSmoothLinks(navigate) {
  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api") || url.pathname.startsWith("/admin")) return;
      const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
      if (samePage && url.hash) return;
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [navigate]);
}

function ScrollProgress() {
  const bar = useRef(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);
  return <div aria-hidden="true" ref={bar} className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-left scale-x-0 bg-gold-400" />;
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={`press fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-emerald-950 text-white shadow-[0_12px_28px_-10px_rgba(6,36,27,0.6)] transition-all duration-300 hover:bg-emerald-800 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
  );
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  useSmoothLinks(navigate);

  // New page: start at the top. In-page anchors: scroll to the target instead.
  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) {
        // Jump straight to the section once the new page has painted.
        const timer = window.setTimeout(() => target.scrollIntoView({ block: "start", behavior: "instant" }), 30);
        return () => window.clearTimeout(timer);
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.key, location.hash]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-emerald-800 focus:shadow-lg"
      >
        Skip to Main Content
      </a>
      <ScrollProgress />
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Keyed by location so every navigation re-renders the page and replays its entrance. */}
        <div key={location.key} className="page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
