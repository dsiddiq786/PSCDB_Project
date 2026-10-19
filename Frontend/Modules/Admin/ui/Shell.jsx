import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api } from "../../Api/client";
import AdminIcon from "./AdminIcon";
import { Badge } from "./kit";
import { initials } from "../lib/format";
import { hasRole, useAdmin } from "../lib/adminContext";

const MENU = [
  { items: [{ to: "/admin", end: true, icon: "dashboard", label: "Dashboard" }] },
  {
    heading: "Operations",
    items: [
      { to: "/admin/check-in", icon: "checkin", label: "Check-in desk" },
      { to: "/admin/attendance", icon: "attendance", label: "Attendance" },
      { to: "/admin/enquiries", icon: "enquiries", label: "Enquiries", badge: "enquiries" },
    ],
  },
  {
    heading: "People",
    items: [
      { to: "/admin/students", icon: "students", label: "Students" },
      { to: "/admin/staff", icon: "staff", label: "Staff" },
      { to: "/admin/enrolments", icon: "enrolments", label: "Enrolments" },
    ],
  },
  {
    heading: "Academics",
    items: [
      { to: "/admin/courses", icon: "courses", label: "Courses and batches" },
      { to: "/admin/shifts", icon: "shifts", label: "Shifts" },
      { to: "/admin/centres", icon: "centres", label: "Centres" },
    ],
  },
  {
    heading: "System",
    items: [
      { to: "/admin/users", icon: "users", label: "Users and roles", role: "superadmin" },
      { to: "/admin/audit", icon: "audit", label: "Audit log", role: "superadmin" },
      { to: "/admin/settings", icon: "settings", label: "Settings" },
    ],
  },
];

function readCollapsed() {
  try {
    return window.localStorage.getItem("pscdb-admin-sidebar") === "collapsed";
  } catch {
    return false;
  }
}

function Toasts({ items, dismiss }) {
  const tones = {
    success: "border-l-emerald-600 [&_.icon]:text-emerald-600",
    error: "border-l-red-600 [&_.icon]:text-red-600",
    warning: "border-l-amber-500 [&_.icon]:text-amber-500",
  };
  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} role={t.tone === "error" ? "alert" : "status"} className={`admin-toast pointer-events-auto flex gap-3 rounded-md border border-l-4 border-slate-200 bg-white p-3.5 shadow-lg ${tones[t.tone] || tones.success}`}>
          <AdminIcon name={t.tone === "success" ? "check" : "alert"} className="icon mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{t.title}</p>
            {t.message && <p className="mt-0.5 text-sm text-slate-600">{t.message}</p>}
          </div>
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="h-6 w-6 shrink-0 rounded text-slate-400 hover:text-slate-700"><AdminIcon name="close" className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function UserMenu({ me, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">{initials(me.name)}</span>
        <span className="hidden text-sm font-semibold text-slate-700 md:block">{me.name}</span>
        <AdminIcon name="chevronDown" className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div className="admin-pop absolute right-0 top-full z-40 mt-1.5 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
          <div className="bg-emerald-950 px-4 py-5 text-center text-white">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-700 font-display text-lg font-bold ring-4 ring-white/10">{initials(me.name)}</span>
            <p className="mt-2 font-semibold">{me.name}</p>
            <p className="text-xs text-white/60">{me.email}</p>
            <div className="mt-2"><Badge value={me.role} /></div>
          </div>
          <div className="flex justify-between gap-2 p-3">
            <Link to="/admin/settings" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Settings</Link>
            <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><AdminIcon name="logout" className="h-4 w-4" />Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shell({ children, toasts, dismissToast, onSignOut }) {
  const { me } = useAdmin();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const [filter, setFilter] = useState("");
  const [newEnquiries, setNewEnquiries] = useState(0);
  // The mobile menu belongs to the page it was opened on, so navigating closes it.
  const mobileOpen = mobileOpenAt === location.key;

  useEffect(() => {
    const controller = new AbortController();
    api("/admin/enquiries?status=new&limit=1", { signal: controller.signal }).then((r) => r.ok && setNewEnquiries(r.data.total));
    return () => controller.abort();
  }, [location.key]);

  const toggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((value) => {
        try {
          window.localStorage.setItem("pscdb-admin-sidebar", value ? "open" : "collapsed");
        } catch {
          /* Ignore storage errors. */
        }
        return !value;
      });
    } else {
      setMobileOpenAt(mobileOpen ? null : location.key);
    }
  };
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  const term = filter.trim().toLowerCase();
  const narrow = collapsed && !mobileOpen;

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-sans text-slate-700">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#05201a] text-white/80 shadow-xl transition-all duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${narrow ? "lg:w-[4.5rem]" : "w-64"}`}
        aria-label="Admin navigation"
      >
        <Link to="/admin" className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          <img src="/brand/crest-768.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
          <span className={`font-display text-lg font-extrabold text-white ${narrow ? "lg:hidden" : ""}`}>PSCDB <span className="font-medium text-white/60">Admin</span></span>
        </Link>
        <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-3.5 ${narrow ? "lg:justify-center lg:px-0" : ""}`}>
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {initials(me.name)}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#05201a]" />
          </span>
          <div className={`min-w-0 ${narrow ? "lg:hidden" : ""}`}>
            <p className="truncate text-sm font-semibold text-white">{me.name}</p>
            <p className="text-xs capitalize text-gold-300">{me.role}</p>
          </div>
        </div>
        <div className={`px-3 pt-3 ${narrow ? "lg:hidden" : ""}`}>
          <div className="relative">
            <AdminIcon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a menu item" aria-label="Find a menu item" className="h-9 w-full rounded-md border border-white/10 bg-white/5 pl-8 pr-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-gold-400/60" />
          </div>
        </div>
        <nav className="admin-scroll flex-1 overflow-y-auto px-3 py-3">
          {MENU.map((group, gi) => {
            const items = group.items.filter((i) => (!i.role || hasRole(me, i.role)) && (!term || i.label.toLowerCase().includes(term)));
            if (!items.length) return null;
            return (
              <div key={gi} className="mb-2">
                {group.heading && <p className={`px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 ${narrow ? "lg:hidden" : ""}`}>{group.heading}</p>}
                <ul className="grid gap-0.5">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        title={narrow ? item.label : undefined}
                        className={({ isActive }) =>
                          `group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${narrow ? "lg:justify-center lg:px-0" : ""} ${
                            isActive ? "bg-emerald-700 text-white shadow-sm" : "hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && <span aria-hidden="true" className="absolute -left-3 top-1.5 h-7 w-1 rounded-r bg-gold-400" />}
                            <AdminIcon name={item.icon} className="h-5 w-5 shrink-0" />
                            <span className={`flex-1 truncate ${narrow ? "lg:hidden" : ""}`}>{item.label}</span>
                            {item.badge === "enquiries" && newEnquiries > 0 && (
                              <span className={`rounded-full bg-gold-400 px-1.5 text-[11px] font-bold text-emerald-950 ${narrow ? "lg:absolute lg:right-1.5 lg:top-1" : ""}`}>{newEnquiries}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <a href="/" className={`flex h-11 shrink-0 items-center gap-3 border-t border-white/10 px-6 text-sm text-white/60 hover:text-white ${narrow ? "lg:justify-center lg:px-0" : ""}`}>
          <AdminIcon name="external" className="h-4 w-4" />
          <span className={narrow ? "lg:hidden" : ""}>View website</span>
        </a>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setMobileOpenAt(null)} />}

      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5">
          <button type="button" onClick={toggle} aria-label="Toggle navigation" className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"><AdminIcon name="menu" /></button>
          <Link to="/admin" className="hidden rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:block">Home</Link>
          <Link to="/admin/check-in" className="hidden rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 sm:block">Check-in desk</Link>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/admin/enquiries" aria-label={`${newEnquiries} new enquiries`} className="relative grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100">
              <AdminIcon name="bell" />
              {newEnquiries > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{newEnquiries}</span>}
            </Link>
            <button type="button" onClick={fullscreen} aria-label="Full screen" className="hidden h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 sm:grid"><AdminIcon name="expand" /></button>
            <a href="/" target="_blank" rel="noreferrer" aria-label="Open the website in a new tab" className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100"><AdminIcon name="external" /></a>
            <UserMenu me={me} onSignOut={onSignOut} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6" id="admin-main">
          <div key={location.pathname} className="admin-enter">{children}</div>
        </main>
        <footer className="flex flex-col justify-between gap-1 border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 sm:flex-row">
          <span><strong className="text-slate-700">PSCDB</strong> Professional Skills and Community Development Board</span>
          <span>Admin panel · signed in as {me.email}</span>
        </footer>
      </div>
      <Toasts items={toasts} dismiss={dismissToast} />
    </div>
  );
}
