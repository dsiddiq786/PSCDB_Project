# PSCDB Brand Book

**Professional Skills and Community Development Board** · pscdb.org
Version 1.0 · October 2026

This is the single reference for everything PSCDB looks like, sounds like and is built with: the public website, the admin panel and any new page or material. It is written so a designer, a developer or an AI assistant can produce new work that is indistinguishable from what exists.

**Using this with an AI tool:** upload this file, then paste the prompt in [section 16](#16-prompt-for-ai-design-and-coding-tools) and describe the page you need. Every value here (colors, sizes, class names, wording rules) is taken from the live code, so the output will match.

---

## Contents

1. [Brand Essence](#1-brand-essence)
2. [Name and Logo](#2-name-and-logo)
3. [Color](#3-color)
4. [Typography](#4-typography)
5. [Voice and Writing Rules](#5-voice-and-writing-rules)
6. [Layout, Spacing and Shape](#6-layout-spacing-and-shape)
7. [Imagery](#7-imagery)
8. [Icons](#8-icons)
9. [Motion](#9-motion)
10. [Website Components](#10-website-components)
11. [Website Page Templates](#11-website-page-templates)
12. [Admin Panel Design System](#12-admin-panel-design-system)
13. [Accessibility](#13-accessibility)
14. [Engineering Conventions](#14-engineering-conventions)
15. [Checklist for Any New Page](#15-checklist-for-any-new-page)
16. [Prompt for AI Design and Coding Tools](#16-prompt-for-ai-design-and-coding-tools)

---

## 1. Brand Essence

**Who we are.** PSCDB is a professional skills board that teaches artificial intelligence and cyber security in its own on-site labs in Sahiwal, Pakistan. Every course ends with a professional skills exam.

**Two domains, one board.** The **Advanced AI Lab** and the **Cyber Security Lab**. Never state how many labs or courses there are as a selling point ("2 labs", "20+ courses"); describe what they do instead.

**Audience.**
- Students from Pakistan and abroad choosing a serious, practical course.
- Working professionals who need evening study.
- Parents, employers, partners and government bodies checking that the institute is credible.

**Personality.** Serious, precise, calm and welcoming. A government-grade institution that is modern, not a startup and not a coaching centre.

| We are | We are not |
|---|---|
| Precise and factual | Hype, superlatives, exclamation marks |
| Practical: labs, tools, exams | Vague promises about careers or salaries |
| Transparent: fees and seats shown up front | Hidden costs, "contact us for price" |
| Calm and confident | Loud colors, busy layouts, stock clichés |

**What every page should make obvious:** what the course or action is, what it costs, when it happens, and the one next step.

---

## 2. Name and Logo

### Name

- Full name: **Professional Skills and Community Development Board**. Short name: **PSCDB** (always capitals, no dots).
- First mention on a page or document: the full name, then PSCDB.
- Domain: **pscdb.org**. Email: **info@pscdb.org**.
- Address: Office No. 11, 1st Floor, Star Complex, Stadium Road, Sahiwal, Pakistan.
- The student learning platform (LMS) will live at **lms.pscdb.org**. It is not live yet, so the site does not link to it (see `Frontend/Modules/Config/institute.js`).

### The crest

- File: `Frontend/public/brand/crest-768.png` (transparent PNG, 768 px). Favicon: `Frontend/public/favicon-64.png`.
- The crest is the only logo. Do not redraw, recolor, outline, rotate, add effects to, or place it inside a shape.
- **Header lockup:** crest at 48 × 48 px, then "PSCDB" in Plus Jakarta Sans ExtraBold 20 px (`text-ink`), with the full name underneath in 11 px medium `text-muted` on large screens only.
- **Admin lockup:** crest 36 px + "PSCDB" ExtraBold white + "Admin" medium white at 60% opacity.
- **Clear space:** at least half the crest's width on every side.
- **Minimum size:** 32 px on screen, 15 mm in print.
- **Backgrounds:** white, cream `#f6f4ef` or deep forest `#06241b`. Never on photos without a solid panel behind it, and never on gold or blue.

---

## 3. Color

Color tokens are defined once in `Frontend/src/index.css` (`@theme`) and used through Tailwind classes such as `bg-emerald-700` or `text-ink`. Never hard-code a new hex value in a component; add a token instead.

### Brand palette

| Role | Token | Hex | Use |
|---|---|---|---|
| Deep forest | `emerald-950` | `#06241b` | Dark bands, page headers, footer, admin sidebar (`#05201a`) |
| Forest | `emerald-900` | `#0a3125` | Gradients on dark bands |
| Green 800 | `emerald-800` | `#0a4a35` | Hover for primary buttons, link text on light |
| **Primary green** | `emerald-700` | `#0b6b47` | Primary buttons, active states, key links |
| Green 600 | `emerald-600` | `#128058` | Progress bars, chart lines, accents |
| Green 500 | `emerald-500` | `#1f9a6c` | Glows on dark backgrounds |
| Mint 300 | `emerald-300` | `#8fd1b2` | Lines and dots on dark backgrounds |
| Mint 100 | `emerald-100` | `#d9efe4` | Subtle fills |
| Mint 50 | `emerald-50` | `#edf7f1` | Tag and icon backgrounds, selected rows |
| Gold 600 | `gold-600` | `#a07b22` | Gold text on light backgrounds |
| Gold 500 | `gold-500` | `#b8902f` | Admin KPI tile |
| **Crest gold** | `gold-400` | `#c9a24a` | Focus ring, small highlights, step numbers |
| Gold 300 | `gold-300` | `#e2c77e` | Eyebrows and highlights on dark backgrounds |
| Gold 200 | `gold-200` | `#f1e3b8` | Text selection |
| Gold 50 | `gold-50` | `#fbf6e8` | Exam notice background |
| Cyber 900 | `cyber-900` | `#0d2152` | Rare: deep cyber accents |
| **Cyber blue** | `cyber-700` / `cyber-600` | `#1747ae` / `#1f5bd8` | Only to mark the Cyber Lab domain |
| Cyber 100 / 50 | `cyber-100` / `cyber-50` | `#dbe6fc` / `#eef3fe` | Cyber tag backgrounds |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14201b` | Headings and strong text |
| `body` | `#37443e` | Body text (also the default page text color) |
| `muted` | `#66726c` | Secondary text, captions, labels |
| `line` | `#e3e0d6` | Borders and dividers on the website |
| `cream-100` / `paper` | `#f6f4ef` | Alternate section background |
| `cream-200` | `#ece8de` | Image placeholders |
| White | `#ffffff` | Cards and the main page background |

The **admin panel** uses Tailwind's built-in `slate` scale for its neutrals (`slate-50` … `slate-800`) and a page background of `#f4f6f9`.

### Rules

- **Green carries the brand; gold is a spice.** On any screen, gold should be under 5% of the area: focus rings, step numbers, one highlighted word, small badges.
- **Blue means cyber, nothing else.** AI Lab items are green; Cyber Lab items are blue (tags, the colored bar on course cards, the dashboard "AI vs Cyber" split).
- **Alternate backgrounds** down a page: white → cream → white → deep forest (one dark band at most between header and footer) → cream. Never three white sections in a row.
- **Status colors** (badges, alerts) use the soft style: tinted background, dark text, thin ring:
  - Success or paid: `bg-emerald-50 text-emerald-800`.
  - Waiting: `bg-amber-50 text-amber-800`.
  - Problem: `bg-red-50 text-red-700`.
  - Inactive: `bg-slate-100 text-slate-600`.
  - New or important: `bg-gold-50 text-gold-600`.
- **Dark bands** (`.surface-dark .texture-grid`) are a deep forest gradient with soft green and gold glows, never a flat color and never a grid pattern.

### Contrast (WCAG AA or better)

| Text on background | Ratio |
|---|---|
| `ink` on white | 16.8 : 1 |
| `body` on white / cream | 10.2 : 1 / 9.3 : 1 |
| `muted` on white / cream | 5.0 : 1 / 4.6 : 1 |
| White on `emerald-700` | 6.5 : 1 |
| `gold-300` on `emerald-950` | 10.0 : 1 |
| White at 75% on `emerald-950` | 9.7 : 1 |

Do not put `gold-400` text on white (2.4 : 1, fails) or `muted` text below 12 px.

---

## 4. Typography

| Role | Font | Weights | Tailwind |
|---|---|---|---|
| Display (headings, numbers in cards, buttons in heroes) | **Plus Jakarta Sans** | 600, 700, 800 | `font-display` |
| Body and UI | **Inter** | 400, 500, 600, 700 | default (`font-sans`) |
| Codes and IDs (AI-301, STU-00004, references) | System monospace | 600 | `font-mono` |

Both fonts load from Google Fonts in `src/index.css`. Headings get `letter-spacing: -0.02em` automatically.

### Website scale

| Element | Classes | Size |
|---|---|---|
| Hero H1 | `font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08]` | 36 → 54 px |
| Page H1 (inner pages) | `font-display text-4xl sm:text-5xl font-extrabold leading-[1.08]` | 36 → 48 px |
| Section H2 | `font-display text-3xl sm:text-4xl font-bold leading-tight` | 30 → 36 px |
| Card or block H3 | `font-display text-lg`–`text-xl font-bold` | 18–20 px |
| Eyebrow | `text-xs font-bold uppercase tracking-[0.16em] text-emerald-700` (`text-gold-300` on dark) | 12 px |
| Lead paragraph | `text-lg leading-8` (`text-white/75` on dark) | 18 px |
| Body | `text-base leading-7` or `text-sm leading-6` in cards | 16 / 14 px |
| Caption, meta | `text-xs text-muted` | 12 px |
| Prices | `font-display font-extrabold tabular` | 24–32 px |

### Admin scale

- Page title: `font-display text-2xl font-bold text-slate-800`.
- Card title: `font-display text-[15px] font-bold`.
- Body: `text-sm`.
- Table header: `text-[11px] uppercase tracking-wider font-bold text-slate-500`.
- KPI value: `font-display text-[28px] font-extrabold`.

### Rules

- Numbers that line up (prices, counts, times) use the `tabular` class (tabular figures).
- Use only the weights listed above. No italics except for quoted titles.
- Maximum line length for reading text: about 70 characters (`max-w-2xl` or `max-w-xl`).

---

## 5. Voice and Writing Rules

### Spelling

**American English everywhere**, including the admin panel and emails:

| Use | Not |
|---|---|
| enroll, enrollment, enrolled | enrol, enrolment |
| on-site (On-Site in titles) | onsite |
| center, centers | centre |
| program (in general text) | programme |
| inquiry, inquiries | enquiry |
| canceled | cancelled |
| organization, optimize, authorize, analyze, recognize | -isation, -ise forms |
| modeling, labeled, traveling | modelling, labelled, travelling |
| defense, license, behavior, color | defence, licence, behaviour, colour |

Code identifiers and database values keep their existing names (for example the `enrolments` API path, the `centre` field and the `cancelled` status value). Only the words people see follow this table.

### Capitalization

**Title Case** for headings, page titles, button and link labels, menu items, form labels, table headers, tab names, badges and toasts, and for names of courses, modules, tools, prerequisites, batches and people:

- Capitalize every word except these, unless first or last: *a, an, the, and, but, or, nor, for, as, at, by, in, of, off, on, per, to, up, via, vs, with, from, into, onto, than*.
- Capitalize both parts of hyphenated words: *Fine-Tuning, Check-In, Hands-On, Open-Source*.
- Keep acronyms and brand names as written: *AI, LLM, CNIC, PKR, USD, SOC, OWASP, PyTorch, pandas, scikit-learn, bitsandbytes*.
- Examples: "What You Will Learn", "Reserve Your Seat in Four Steps", "Morning Batch", "Enroll Now", "Check-In Desk".

**Sentence case** for paragraphs, questions (FAQ), list items that are sentences, course outcomes, hints, error messages and helper text: "Your seat is held for 30 minutes while you pay."

People's names typed into forms are capitalized automatically by the server ("ayesha KHAN" is saved as "Ayesha Khan"; see `Backend/services/names.js`).

### Tone

- Short sentences, active voice, second person: "Choose a batch", "You pay in US dollars".
- State facts the institute can stand behind. Do not invent statistics, partners, accreditations, testimonials, salaries or placement rates.
- No exclamation marks, no emojis, no "world-class", "best in town", "revolutionary", "unlock your potential".
- Every error says what happened and what to do: "This batch is full. Choose another batch or contact admissions."
- Every empty state says what will appear and how to add it: "No students yet. Use Add Student to create the first one."

### Formats

| Thing | Format | Example |
|---|---|---|
| Price | US dollars first, rupees as reference | **$135** · PKR 37,395 |
| Rupees | `PKR` + space + grouped digits, no decimals | PKR 34,625 |
| Exchange rate | set by admins in Settings | PKR 277 per USD |
| Date | day, short month, year | 19 Oct 2026 |
| Date and time | 24-hour clock | 19 Oct 2026, 18:42 |
| Day label | weekday first | Mon, 19 Oct 2026 |
| Time range | "to", not a dash | 09:00 to 13:00 |
| Phone | international | +92 300 1234567 |
| Course code | 2–4 letters, hyphen, 3 digits | AI-301, CY-401 |
| Student ID | `STU-` + 5 digits | STU-00017 |
| Staff ID | `STF-` + 4 digits | STF-0003 |
| Booking reference | `PSCDB-` + 10 characters | PSCDB-7K4MX9QH2A |
| Durations | number + word | 8 weeks |

### Words we use

Course (not "track" or "programme"), batch (Morning Batch, Evening Batch), seat, enroll, fee, exam fee, professional skills exam, lab, AI Lab / Advanced AI Lab, Cyber Lab / Cyber Security Lab, admissions, center, student, staff, check-in, inquiry.

---

## 6. Layout, Spacing and Shape

- **Container:** `mx-auto max-w-7xl px-5 sm:px-8 lg:px-10` (1280 px maximum, 20/32/40 px gutters). Use the `Container` component.
- **Breakpoints:** Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Design mobile-first; test at 375, 768, 1024 and 1440 px. Pages must never scroll sideways.
- **Section rhythm:** `py-16`–`py-20` (`sm:py-24` for feature sections); headings to content `mt-10`–`mt-12`; card grids `gap-5`–`gap-6`.
- **Common grids:** two columns `lg:grid-cols-2`; text + media `lg:grid-cols-[1.1fr_0.9fr]`; content + sticky sidebar `lg:grid-cols-[1fr_380px]` (website) or `lg:grid-cols-[20rem_minmax(0,1fr)]` (admin profile).
- **Radius:** buttons and inputs `rounded-lg` (8 px) on the website and `rounded-md` (6 px) in admin; cards `rounded-xl` (12 px) or `rounded-2xl` (16 px) for featured cards; admin cards `rounded-lg`; pills `rounded-full`.
- **Borders:** 1 px `border-line` (website) or `border-slate-200` (admin). Prefer a border to a shadow.
- **Shadows:**
  - Cards at rest: none, or `shadow-[0_1px_2px_rgba(15,23,42,0.06)]` in admin.
  - Hover: `shadow-[0_24px_48px_-24px_rgba(6,36,27,0.45)]`.
  - Floating panels: `shadow-[0_20px_40px_-28px_rgba(6,36,27,0.45)]`.
- **Sticky header** height 72 px (website), 56 px (admin). Anchor targets need `scroll-mt-24`.
- Grid children that can contain long words or tables need `min-w-0`.

---

## 7. Imagery

- **Sources:** the lab photographs in `public/images/lab/` (`ai-lab-room`, `ai-lab-team`, `cyber-lab-room`, `cyber-lab-team`, `labs-split`) and course thumbnails in `public/thumbnails/<course-slug>.jpg`. Leadership portraits are in `public/images/optimised/leadership/`.
- **The lab images are illustrations.** Their alt text says so ("Illustration of students working in the AI Lab"), and the footer states that lab images are illustrative. When real photographs of the Sahiwal labs exist, replace the files with the same names.
- **Look:** real working environments with screens, people at work, and green and blue ambient light. No cartoon robots, padlocks, hooded hackers, binary rain or handshake stock photos.
- **Ratios:** course thumbnails 16:9; hero slider 4:3.3; page header images 4:3; lab banners 16:7; portraits 4:5.
- **Format:** JPG at 80% quality, at most 1600 px wide and under 300 KB, with `loading="lazy"` below the fold and explicit `width` and `height` where known.
- **Alt text:** describe what is shown; decorative images get `alt=""`.
- **Profile pictures** (admin) are cropped square, converted to WebP, stripped of metadata and shown in circles. Without a picture, show initials on green.

---

## 8. Icons

- **Style:** single-weight line icons on a 24 × 24 grid; stroke 1.8 (2.2–2.6 for small check marks); round caps and joins; `fill="none"`, `stroke="currentColor"`; always `aria-hidden="true"`.
- **Sets in code:**
  - Website: `Frontend/Components/icons.jsx` (`<Icon name="…" />`), with search, clock, user, card, check, checkCircle, ticket, sun, moon, pin, award, lock, shield, receipt, currency, timer, mail, refresh, alert, arrow, book and layers.
  - Admin: `Frontend/Modules/Admin/ui/AdminIcon.jsx` (`<AdminIcon name="…" />`), with dashboard, students, staff, enrolments, courses, shifts, centres, checkin, attendance, enquiries, users, audit, settings, plus action icons such as plus, edit, trash, eye, download, columns and refresh.
- **Sizes:** 16 px inline with text, 20 px in buttons and menus, 24 px in feature tiles.
- **Icon tiles:** 40–48 px square, `rounded-xl`. Use either `bg-emerald-950 text-gold-300` (strong) or `bg-emerald-50 text-emerald-700` (soft).
- To add an icon, add its paths to the relevant set in the same style. Do not mix in other icon libraries.

---

## 9. Motion

Motion is quiet and quick; it shows hierarchy, never decoration.

| Pattern | Spec | Class or component |
|---|---|---|
| Page entrance | fade and rise 10 px, about 450 ms | `.page-enter` (website), `.admin-enter` (admin) |
| Scroll reveal | fade and rise, staggered 60–90 ms per item | `<Reveal delay={…}>` |
| Hero entrance | staggered rise | `.rise` with `--delay` |
| Card hover | lift 4 px, larger shadow, image zoom 1.05 over 700 ms | `.card-lift`, `group-hover:scale-105` |
| Dialogs and menus | scale 0.98 → 1 with fade, 180 ms | `.admin-pop` |
| Slide-over | from the right, 260 ms | `.admin-slide` |
| Buttons | color change 200 ms; press scales to 0.98 | built in |
| Hero background | slow particle field forming a neural network, then a shield that blocks red warning-triangle "threats" | `Components/HeroParticles.jsx` |

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-soft`) for entrances.
- **Reduced motion:** every animation is disabled under `prefers-reduced-motion: reduce`. The particle hero shows a still frame and the slider stops rotating. Any new animation must do the same.
- Never animate layout-heavy properties in loops, and never auto-play video.

---

## 10. Website Components

All shared parts are in `Frontend/Components/ui.jsx` unless noted. Use them; do not restyle copies.

### Buttons

| Variant | Classes | Use |
|---|---|---|
| Primary | `inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800` | One main action per view |
| Primary on dark | `… bg-white text-emerald-950 font-bold hover:bg-cream-100` (`min-h-12 px-6`) | Heroes and dark bands |
| Secondary | `… border border-line bg-white text-ink hover:border-emerald-700` | Second action |
| Secondary on dark | `… border border-white/30 text-white hover:border-white` | Second action on dark |
| Text link | `text-sm font-semibold text-emerald-800 hover:underline` with a → arrow | "View Course →" |

- Touch targets are at least 44 px tall (`min-h-11`).
- Labels are Title Case verbs: Enroll Now, Browse Courses, Reserve a Seat, Contact Admissions.

### Section heading

`<SectionHeading eyebrow="Fee Schedule" title="Fees for Every Course" align="left|center" tone="light|dark">Optional intro sentence.</SectionHeading>`

It renders a gold or green eyebrow, a display H2, and an optional muted lead paragraph.

### Page header (every inner page)

`<PageHeader crumbs={[{ label: "Courses" }]} eyebrow="Courses" title="…" intro="…" image="…" aside={<Card/>}>buttons</PageHeader>`

- It renders a deep forest band with drifting particles, breadcrumb, eyebrow, H1, intro and up to two buttons.
- On the right it shows an optional image or a custom aside, such as the fee receipt on the Fees page or the checklist on Admissions.

### Course card (`Modules/Catalogue/CourseParts.jsx`)

- A 16:9 thumbnail with a 4 px bar along the top: green for AI, blue for Cyber.
- Lab name · code, then a 2-line Title Case title and a 2-line summary.
- Level and duration with icons.
- A divider, then the fee in large display type with PKR underneath, and the exam fee note on the right ("+ $90 exam fee" or "Exam Fee Included").

The whole card is one link. It lifts on hover.

### Tags and badges

- **Lab tag:** `rounded-full px-2.5 py-1 text-xs font-semibold` with a colored dot; green for AI, blue for Cyber.
- **Code tag:** `rounded bg-emerald-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-gold-300`.
- **Status pill:** soft tinted style (see Color rules).

### Fee panel and receipt

A white card with rows: Course Fee, Professional Skills Exam, then a dashed divider and Total in large display type. USD comes first, with PKR underneath in `text-xs text-muted`, and the note "Charged in US dollars. Rupee amounts are shown for reference."

### Forms (public)

- Each label sits above its field: `text-sm font-semibold text-ink`.
- Inputs: `h-11 rounded-lg border border-line px-3`, with focus state `border-emerald-600 ring-2 ring-emerald-100`.
- Errors show under the field in `text-sm text-red-700`, with `aria-invalid` set on the input.
- Optional fields say "(Optional)" in muted text.
- Submit buttons show a progress label while busy ("Sending…").

### Accordions (FAQ, course modules)

Built on native `<details>`:
- Bold question in `font-display`.
- A round "+" that rotates 45° when open.
- The answer in `text-sm leading-7 text-muted`.

### Other patterns

- **Stepper:** numbered icon tiles (`bg-emerald-950 text-gold-300`) with a small gold number badge, joined by a thin gradient line on desktop and stacked on mobile.
- **Fact strip:** a white card that overlaps the bottom of a page header (`-top-8`), with 4 columns of icon tile + title + one-line text.
- **Filter pills:** `rounded-full border border-line bg-cream-100 p-1`. The active pill is `bg-emerald-950 text-white`.
- **Hero:** a dark band with the particle background, then H1 + lead + search + popular chips + two buttons on the left, and the image slider on the right. The slider auto-rotates every 6 seconds and has dot progress and arrows.
- **Header:**
  - A dark utility bar: tagline, email, Contact.
  - A white sticky bar: crest lockup, menu (Courses, AI Lab, Cyber Lab, Admissions, Fees, About), search icon and Enroll Now.
  - The active menu item gets a green underline.
- **Footer:** deep forest, with link columns (Courses, Students, PSCDB) and a line saying lab images are illustrative.

---

## 11. Website Page Templates

| Page | Path | Structure |
|---|---|---|
| Home | `/` | Hero → key facts strip → course rail with lab filter → labs band (dark) → how enrollment works (4 steps) → international students → leadership → FAQ → closing call to action |
| Courses | `/courses` | Page header → sidebar filters (search, lab, level, batch with seats) + sort + card grid |
| Course detail | `/courses/:slug` | Dark header with code, lab, title, summary and facts → image → what you will learn → batches and seats table → course content accordion → prerequisites and tools → exam notice → sticky fee panel with Enroll Now → related courses |
| Enroll | `/enroll/:slug` | 3 steps: batch → details → review and pay, with an order summary sidebar |
| Confirmation | `/enroll/confirmation?ref=` | Status (paid, waiting, expired) with booking details, print button |
| Lab | `/labs/ai`, `/labs/cyber` | Page header with image → core areas → environment band (dark, terminal snippet) → courses in this lab → code of conduct |
| Admissions | `/admissions` | Header with "Before You Start" checklist → fact strip → 5-step process → batches → entry levels → prerequisites by course → FAQ → call to action |
| Fees | `/fees` | Header with example receipt → how fees work → fee schedule (lab filter, USD/PKR switch) → what happens when you pay (dark) → payment security → help |
| About, Leadership, Careers, Contact, Search, 404 | `/about`, `/leadership`, `/careers`, `/contact`, `/search`, any | Page header + the standard section rhythm |

Old addresses `/programmes`, `/payments` and `/enrol/…` redirect to the new ones.

**New page recipe:** `PageHeader` → 3–5 sections alternating white and cream, each opening with a `SectionHeading` → an optional single dark band → a closing call to action. Wrap groups in `<Reveal>` and stagger items.

---

## 12. Admin Panel Design System

The admin panel (`/admin`, code in `Frontend/Modules/Admin/`) follows the AdminLTE pattern in PSCDB colors. It loads separately from the public site.

### Shell

- **Sidebar**, 256 px wide, collapsing to 72 px and off-canvas on phones:
  - Background `#05201a`, with the crest lockup and a user panel (avatar, name, job title or role in gold).
  - A menu search box, then groups headed in `text-[10px] uppercase tracking-[0.14em] text-white/35`: Operations, People, Academics, System.
  - Active item: `bg-emerald-700 text-white` with a 4 px gold bar on the left edge.
  - A gold count badge shows new inquiries.
- **Top bar:** 56 px, white with a bottom border. It holds the menu toggle, Home and Check-In Desk links, notifications bell, full screen, open website, and the user menu (picture, My Profile, Sign Out).
- **Content area:** background `#f4f6f9`, padding 16–24 px. Each page starts with a page header: icon tile, title, breadcrumb on the right, optional action buttons.
- **Footer:** white, small text with the institute name and the signed-in email.

### Building blocks (`ui/kit.jsx`)

| Component | Look | Use |
|---|---|---|
| `Card` | white, `rounded-lg border-slate-200`, header row with title, optional icon and tools; optional 3 px top accent (emerald, blue, gold, red) | Every panel |
| `SmallBox` | gradient tile (emerald, blue, gold, slate), big number, label, faded large icon, "More Info" footer link | Top-row KPIs on the dashboard |
| `InfoBox` | white box with a 56 px colored icon square, label, value, optional progress bar | Secondary KPIs, profile stats |
| `Btn` | `h-9 rounded-md px-3.5 text-sm font-semibold`; variants primary (green), secondary (white bordered), danger (red), ghost, gold | All actions |
| `IconBtn` | 32 px square, tinted on hover: blue view, amber edit, red delete, green special | Row actions |
| `Badge` | soft status pill; text from the label map in `lib/format.js` | Status, role, type |
| `Modal`, `Confirm` | centered dialog, rendered into `document.body`, Escape closes it, focus moves inside | Forms and confirmations |
| `Field`, `inputClass`, `Switch` | label above; `h-9 rounded-md border-slate-300` inputs; green focus ring | Forms |
| `Avatar` (`ui/Avatar.jsx`) | circle picture or initials on green | People everywhere |
| `EmptyState` | gray circle icon, title, one helpful line | Empty lists |

### Data tables (`ui/DataTable.jsx`)

Every list page uses the same table, configured in `lib/resources.jsx`. It has:
- **Toolbar:** search (debounced, server-side), filter dropdowns ("Status: All"), date range, Columns picker (remembered per browser), Export CSV (managers and above), Refresh, and Add (green, top right).
- **Header row:** sortable columns with arrows.
- **Rows:** a selection checkbox (bulk delete bar appears when rows are selected); the actions column is pinned to the right with view, edit and delete.
- **Footer:** "Showing 1 to 10 of 57 entries", rows per page (10/25/50/100), numbered pagination.
- **Loading and empty:** skeleton rows while loading; a helpful empty state.

### Forms (`ui/RecordForm.jsx`)

A two-column dialog.
- **Field types:** text, email, phone, number, money (with $ prefix), date, time, datetime, select, multi-select chips, day picker, switch, textarea, a searchable student picker, and dependent selects (the batch list follows the chosen course).
- **Validation:** client-side for required fields. Server messages appear under the exact field.
- **Saving:** a success toast, then the list refreshes.

### Profile page (`pages/ProfilePage.jsx`)

One design for **My Profile** (`/admin/profile`), users, staff and students (`/admin/<kind>/<id>`):

- **Left identity card:**
  - A deep forest cover band.
  - A 112 px avatar with an edit button, if the viewer may change it.
  - Name, ID or job title, and role and status badges.
  - Quick facts: email, phone, CNIC or shift, last sign-in, member since.
- **Right side:**
  - Stat boxes: enrollments, fees paid and attendance for students; role, admin access and attendance for staff.
  - Tabs: Overview, Security (own profile only), Enrollments, Attendance, Activity.
- **Own profile:**
  - Edit name, job title and phone.
  - Change your password: it needs the current password, has live rules, and signs out other devices.
  - Upload or remove your picture (JPG, PNG or WebP up to 2 MB).
  - Email and role can only be changed by a superadmin.

### Toasts and feedback

- Toasts appear in the top right with a 4 px left border: green for success, amber for warnings, red for errors.
- They close by themselves after 4.5 s (errors after 7 s).
- Titles are Title Case ("Changes Saved"); messages are sentences.
- Destructive actions always ask first with a `Confirm` dialog that names the record.

### Roles

| Role | Can |
|---|---|
| Staff | Check-in desk, students, inquiries, viewing other records |
| Manager | Everything above plus courses, batches, shifts, centers, staff, enrollments and CSV exports |
| Superadmin | Everything, including users and roles, settings and the audit log |

Show only what a role can use; the server enforces the same rules.

---

## 13. Accessibility

Target WCAG 2.2 AA.

- **Semantics:** one H1 per page, headings in order, landmarks (`header`, `nav`, `main`, `footer`), a "Skip to Main Content" link, and `aria-current="page"` on the active menu item.
- **Keyboard:**
  - Everything works with the keyboard.
  - Focus shows as a 2 px gold outline.
  - Dialogs trap focus and close on Escape.
  - Menus close on Escape.
- **Labels:** every input has a visible label. Icon-only buttons have `aria-label`. Status changes are announced with `aria-live`.
- **Errors and contrast:** form errors use `aria-invalid` and text, not color alone. Keep the text contrast pairs in section 3.
- **Size and motion:** tap targets are at least 44 px on the public site. Reduced motion is respected everywhere.

---

## 14. Engineering Conventions

### Stack

- **Frontend:** React 19, React Router 7, Vite, Tailwind CSS 4 (tokens in `src/index.css`).
- **Backend:** Express 5, Mongoose 9 (MongoDB 8.2), argon2id passwords, JWT in an httpOnly cookie, Stripe Checkout, sharp for images.
- **Deployment:** Docker Compose (web nginx, api, mongo) behind the server's nginx-proxy with Let's Encrypt. See `DEPLOY.md`.

### Where things live

| What | Where |
|---|---|
| Design tokens, global styles, animations | `Frontend/src/index.css` |
| Shared website components | `Frontend/Components/ui.jsx`, `icons.jsx` |
| Course content (summaries, modules, tools) | `Frontend/Modules/Programmes/data/programmes.json` (fees, batches and seats come live from the API) |
| Institute details (name, email, LMS address) | `Frontend/Modules/Config/institute.js` |
| Admin sections (columns, filters, forms) | `Frontend/Modules/Admin/lib/resources.jsx` |
| Admin labels and status colors | `Frontend/Modules/Admin/lib/format.js` |
| Admin API resources and rules | `Backend/admin/resources.js` (generic CRUD in `Backend/services/crud.js`) |

### Adding an admin section

1. Add the Mongoose model in `Backend/DBModels`.
2. Declare the resource (fields, search, sort, filters, roles, rules) in `Backend/admin/resources.js`.
3. Add the matching config (columns, filters, form) in `lib/resources.jsx`.
4. Add a route in `AdminApp.jsx` and a menu item in `ui/Shell.jsx`.

The table, forms, export, permissions and audit log then work automatically.

### Security rules (non-negotiable)

- Validate every input on the server. Accept only declared fields, and never pass request objects into database queries.
- Every admin route checks the role on the server. Record every change in the audit log.
- Never show stack traces or internal errors. Never log passwords, OTPs, tokens or card data.
- Personal data stays out of git: uploads live only in the server's `uploads` volume.
- Uploaded images are re-encoded and stripped of metadata, and only served to signed-in staff.
- Prices are always calculated on the server. Payments are confirmed only by the signed Stripe webhook.
- No inline scripts. The Content-Security-Policy in `Frontend/security-headers.conf` must keep working.

### Quality bar

- `npm run lint` and `npm run build` pass with no errors.
- Test every page at 375, 768, 1024 and 1440 px with no sideways scrolling.
- Test with reduced motion turned on.
- Any new text follows section 5.

---

## 15. Checklist for Any New Page

- [ ] Uses `PageHeader` (website) or the admin page header, with a breadcrumb.
- [ ] One H1; Title Case headings and buttons; sentence case for body text.
- [ ] American spelling; the words from the vocabulary list; no invented facts or numbers.
- [ ] Colors only from the tokens; gold used sparingly; blue only for cyber.
- [ ] Sections alternate backgrounds; at most one dark band.
- [ ] Existing components reused (buttons, cards, badges, tables, forms, icons).
- [ ] Prices in USD with PKR reference; dates as 19 Oct 2026; 24-hour times.
- [ ] Works on phones; keyboard and screen-reader friendly; reduced motion respected.
- [ ] Images have alt text; illustrations are described as illustrations.
- [ ] Lint and build pass; for admin, roles are enforced on the server and actions are audited.

---

## 16. Prompt for AI Design and Coding Tools

Copy this, attach this brand book, and replace the last line with your request.

```
You are designing and building for PSCDB (Professional Skills and Community Development Board), an
on-site AI and cyber security training institute in Sahiwal, Pakistan. The attached PSCDB Brand Book is the
source of truth: follow it exactly.

Requirements:
- Stack: React 19 function components, React Router 7, Tailwind CSS 4 using ONLY the PSCDB tokens
  (emerald-50…950, gold-50…600, cyber-50…900, ink, body, muted, line, cream-100/200, slate for admin).
  No new hex colors, fonts or icon libraries.
- Fonts: Plus Jakarta Sans (font-display) for headings, prices and big numbers; Inter for everything else.
- Reuse existing components: Container, PageHeader, SectionHeading, Eyebrow, Reveal, Icon (website);
  Card, Btn, IconBtn, Badge, SmallBox, InfoBox, Modal, Confirm, Field, inputClass, Avatar, DataTable,
  RecordForm, PageHeader (admin).
- Layout: max-w-7xl container with px-5 sm:px-8 lg:px-10; sections py-16 to py-24 alternating white and
  cream-100 with at most one deep forest band; mobile-first; no horizontal scroll at 375px.
- Text: American English; Title Case for headings, buttons, labels, tabs, badges and names; sentence case
  for paragraphs and help text; vocabulary: enroll, enrollment, center, inquiry, course, batch, seat; prices
  as "$135" with "PKR 37,395" underneath; dates "19 Oct 2026"; 24-hour times; no exclamation marks, emojis
  or invented statistics, partners or testimonials.
- Accessibility: one H1, labels on every input, aria-label on icon buttons, visible gold focus ring,
  44px tap targets on public pages, respect prefers-reduced-motion.
- Admin pages: AdminLTE structure inside the existing Shell; role checks (staff, manager, superadmin) on
  the server; every change audited.

Return complete, working code with file paths, then list any new text you wrote so it can be checked.

Request: <describe the page, section or feature you need>
```
