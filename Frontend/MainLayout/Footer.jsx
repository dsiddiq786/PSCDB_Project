import { centres, institute } from "../Modules/Config/institute";

const columns = [
  {
    title: "Courses",
    links: [
      { label: "All courses", href: "/programmes" },
      { label: "AI Lab courses", href: "/programmes?lab=ai" },
      { label: "Cyber Lab courses", href: "/programmes?lab=cyber" },
      { label: "Fees and payments", href: "/payments" },
    ],
  },
  {
    title: "Students",
    links: [
      { label: "How to enrol", href: "/admissions" },
      { label: "Student login (LMS)", href: institute.lmsUrl },
      { label: "Code of conduct", href: "/about#conduct" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "PSCDB",
    links: [
      { label: "About", href: "/about" },
      { label: "Leadership", href: "/leadership" },
      { label: "Advanced AI Lab", href: "/labs/ai" },
      { label: "Cyber Security Lab", href: "/labs/cyber" },
      { label: "Careers", href: "/careers" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="surface-dark">
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="/" className="flex items-center gap-3" aria-label="PSCDB home">
              <img src="/brand/crest-768.png" alt="" width="56" height="56" className="h-14 w-14 object-contain" />
              <span className="flex flex-col leading-tight">
                <span className="font-display text-xl font-extrabold text-white">PSCDB</span>
                <span className="text-xs text-white/60">Professional Skills and Community Development Board</span>
              </span>
            </a>
            <p className="mt-6 text-sm leading-7 text-white/65">
              Onsite courses and professional skills exams in artificial intelligence and cyber security.
            </p>
            <address className="mt-6 text-sm not-italic leading-7 text-white/75">
              {centres[0].address}
              <br />
              <a href={`mailto:${institute.email}`} className="font-semibold text-gold-300 hover:text-gold-200">{institute.email}</a>
            </address>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-bold text-white">{column.title}</h2>
              <ul className="mt-5 flex flex-col gap-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-white/65 transition-colors hover:text-white">{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} PSCDB. All rights reserved.</p>
          <p>Lab images on this website are illustrative. Offensive security is taught only in authorised, isolated lab environments.</p>
        </div>
      </div>
    </footer>
  );
}
