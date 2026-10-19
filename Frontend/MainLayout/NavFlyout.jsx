import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/* Desktop dropdown for the main menu.

   A top item opens a panel. When the groups in that panel have children (institutes with
   certifications, labs with courses), the panel shows two panes side by side: the groups on
   the left and the children of the active group on the right. Keeping both levels inside one
   panel means there is never a gap between them, nothing is clipped by a scrolling list, and
   moving the pointer from a group to its children cannot close the menu.

   Pointer: opens on hover with a short delay, and stays open while the pointer is anywhere over
   the trigger or the panel. Switching groups waits briefly, so a diagonal move towards the
   right pane does not change the active group on the way.
   Keyboard: Enter, Space or Arrow Down opens; Up and Down move through groups; Right moves into
   the children and Left back; Escape closes and returns focus to the trigger.
   Touch: the first tap opens the panel instead of following the link; the next tap follows it. */

const OPEN_DELAY = 80;
const CLOSE_DELAY = 180;
const SWITCH_DELAY = 110;

export default function NavFlyout({ label, href, groups, footer, active }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [alignRight, setAlignRight] = useState(false);
  const timers = useRef({});
  const root = useRef(null);
  const panel = useRef(null);
  const trigger = useRef(null);
  const lastPointer = useRef("mouse");
  const id = useId();
  const hasChildren = groups.some((g) => g.children?.length);
  const activeGroup = groups[current];

  const clear = (name) => window.clearTimeout(timers.current[name]);
  const later = (name, fn, ms) => {
    clear(name);
    timers.current[name] = window.setTimeout(fn, ms);
  };
  const close = useCallback(() => {
    clear("open");
    clear("close");
    clear("switch");
    setOpen(false);
  }, []);
  useEffect(() => () => Object.values(timers.current).forEach((t) => window.clearTimeout(t)), []);

  // Keep the panel inside the viewport: align it to the trigger's right edge when it would overflow.
  useLayoutEffect(() => {
    if (!open || !panel.current || !root.current) return;
    const triggerBox = root.current.getBoundingClientRect();
    const width = panel.current.offsetWidth;
    setAlignRight(triggerBox.left + width > window.innerWidth - 16);
  }, [open, current]);

  // Close when focus or a click moves outside, or on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !root.current?.contains(e.target) && close();
    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onEnter = (e) => {
    lastPointer.current = e.pointerType;
    if (e.pointerType !== "mouse") return;
    clear("close");
    if (!open) later("open", () => setOpen(true), OPEN_DELAY);
  };
  const onLeave = (e) => {
    if (e.pointerType !== "mouse") return;
    clear("open");
    later("close", () => setOpen(false), CLOSE_DELAY);
  };

  const focusItem = (pane, index) => {
    const items = panel.current?.querySelectorAll(`[data-pane="${pane}"] [role="menuitem"]`);
    if (!items?.length) return;
    items[(index + items.length) % items.length].focus();
  };

  const onTriggerKey = (e) => {
    if (e.key === "ArrowDown" || ((e.key === "Enter" || e.key === " ") && !open)) {
      e.preventDefault();
      setOpen(true);
      setCurrent(0);
      window.requestAnimationFrame(() => focusItem("groups", 0));
    }
  };

  const onTriggerClick = (e) => {
    // On touch, the first tap opens the menu; the second follows the link.
    if (lastPointer.current !== "mouse" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onPanelKey = (e) => {
    const pane = e.target.closest("[data-pane]")?.dataset.pane;
    const items = [...(panel.current?.querySelectorAll(`[data-pane="${pane}"] [role="menuitem"]`) || [])];
    const index = items.indexOf(e.target);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(pane, index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(pane, index - 1);
    } else if (e.key === "ArrowRight" && pane === "groups" && activeGroup?.children?.length) {
      e.preventDefault();
      focusItem("children", 0);
    } else if (e.key === "ArrowLeft" && pane === "children") {
      e.preventDefault();
      focusItem("groups", current);
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div ref={root} className="relative" onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <a
        ref={trigger}
        href={href}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onKeyDown={onTriggerKey}
        onClick={onTriggerClick}
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        className={`relative inline-flex items-center gap-1 rounded-md px-3 py-2 text-[15px] font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-[17px] after:h-0.5 after:rounded-full after:bg-emerald-700 after:transition-transform after:duration-300 ${
          active || open ? "text-emerald-800 after:scale-x-100" : "text-body after:scale-x-0 hover:text-emerald-800"
        }`}
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
      </a>

      {open && (
        // pt-3 is an invisible bridge between the trigger and the panel, so the pointer never crosses a gap.
        <div className={`absolute top-full z-[60] pt-3 ${alignRight ? "right-0" : "left-0"}`}>
          <div
            ref={panel}
            id={id}
            role="menu"
            aria-label={label}
            onKeyDown={onPanelKey}
            className="nav-flyout flex overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_48px_-20px_rgba(6,36,27,0.35)]"
          >
            <div data-pane="groups" className={`flex max-h-[min(70vh,32rem)] flex-col overflow-y-auto p-2 ${hasChildren ? "w-64 border-r border-line bg-cream-100/60" : "w-60"}`}>
              {groups.map((g, i) => (
                <a
                  key={g.key}
                  href={g.href}
                  role="menuitem"
                  aria-haspopup={g.children?.length ? "menu" : undefined}
                  aria-expanded={g.children?.length ? current === i : undefined}
                  onPointerEnter={(e) => e.pointerType === "mouse" && later("switch", () => setCurrent(i), current === i ? 0 : SWITCH_DELAY)}
                  onPointerLeave={() => clear("switch")}
                  onFocus={() => setCurrent(i)}
                  onClick={(e) => {
                    // On touch, tapping a group shows its children first.
                    if (lastPointer.current !== "mouse" && g.children?.length && current !== i) {
                      e.preventDefault();
                      setCurrent(i);
                    } else close();
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${hasChildren && current === i ? "bg-white font-semibold text-emerald-800 shadow-sm ring-1 ring-line" : "text-ink hover:bg-white"}`}
                >
                  {g.logo && <img src={g.logo} alt="" className="h-5 w-7 shrink-0 object-contain" loading="lazy" />}
                  <span className="min-w-0 flex-1 truncate">{g.label}</span>
                  {g.children?.length ? (
                    <>
                      <span className="text-[11px] text-muted">{g.children.length}</span>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
                    </>
                  ) : null}
                </a>
              ))}
              {footer && (
                <a href={footer.href} role="menuitem" onClick={close} className="mt-1 rounded-lg border-t border-line px-3 pb-1.5 pt-3 text-sm font-semibold text-emerald-800 hover:underline">
                  {footer.label} →
                </a>
              )}
            </div>

            {hasChildren && (
              <div data-pane="children" role="group" aria-label={activeGroup?.label} className="flex max-h-[min(70vh,32rem)] w-80 flex-col overflow-y-auto p-2">
                <p className="px-3 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{activeGroup?.label}</p>
                {activeGroup?.children?.length ? (
                  <div key={activeGroup.key} className="nav-flyout-pane flex flex-col">
                    {activeGroup.children.map((c) => (
                      <a key={c.href} href={c.href} role="menuitem" onClick={close} className="group rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-emerald-50 focus:bg-emerald-50">
                        <span className="block font-medium leading-snug group-hover:text-emerald-800">{c.label}</span>
                        {c.meta && <span className="mt-0.5 block text-xs text-muted">{c.meta}</span>}
                      </a>
                    ))}
                    {activeGroup.href && (
                      <a href={activeGroup.href} role="menuitem" onClick={close} className="mt-1 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:underline">
                        {activeGroup.viewLabel || `View ${activeGroup.label}`} →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted">Nothing is listed here yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
