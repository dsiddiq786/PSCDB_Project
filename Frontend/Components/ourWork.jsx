import ScrollReveal3D from "./ScrollReveal3D";

const workAreas = [
  {
    number: "01",
    label: "Learning & development",
    title: "Skills and professional training",
    description:
      "Design skills-development and professional training pathways that help people build practical, career-relevant capabilities.",
    tags: ["Technical skills", "Professional learning", "Certification pathways"],
    accent: "#A7E85A",
    icon: "skills",
  },
  {
    number: "02",
    label: "Technology",
    title: "Digital services and emerging tech",
    description:
      "Develop technology solutions and learning opportunities across software, AI, cybersecurity, cloud and other emerging fields.",
    tags: ["Software", "AI & cybersecurity", "Digital skills"],
    accent: "#65C8FF",
    icon: "technology",
  },
  {
    number: "03",
    label: "Business growth",
    title: "Entrepreneurship and incubation",
    description:
      "Support business development through entrepreneurship learning, mentoring, incubation and startup-focused services.",
    tags: ["Entrepreneurship", "Mentoring", "Business support"],
    accent: "#F2C14E",
    icon: "business",
  },
  {
    number: "04",
    label: "Career readiness",
    title: "Language and employability",
    description:
      "Build communication and employability skills through language learning, professional development and test-preparation services.",
    tags: ["Languages", "Communication", "Career development"],
    accent: "#FF82B2",
    icon: "language",
  },
  {
    number: "05",
    label: "Digital learning",
    title: "Online and blended education",
    description:
      "Enable flexible learning through digital platforms, learning systems, educational content and virtual learning experiences.",
    tags: ["Online learning", "Learning platforms", "Digital content"],
    accent: "#B9A0FF",
    icon: "learning",
  },
  {
    number: "06",
    label: "Community impact",
    title: "Community development",
    description:
      "Contribute to community capacity through skills access, digital literacy, employability and responsible development initiatives.",
    tags: ["Digital literacy", "Skills access", "Community support"],
    accent: "#FF9D78",
    icon: "community",
  },
  {
    number: "07",
    label: "Digital commerce",
    title: "E-commerce and marketplaces",
    description:
      "Develop digital marketplace services that can connect businesses and consumers for lawful products and services.",
    tags: ["E-commerce", "Digital platforms", "Business services"],
    accent: "#71E0C1",
    icon: "commerce",
  },
  {
    number: "08",
    label: "Institutional collaboration",
    title: "Education partnerships",
    description:
      "Explore lawful collaborations with schools, universities, education providers and professional institutions.",
    tags: ["Academic collaboration", "Learning centers", "Partnerships"],
    accent: "#E9A7FF",
    icon: "partnership",
  },
];

function WorkIcon({ type }) {
  const paths = {
    skills: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h7M8 10h5" />
      </>
    ),
    technology: (
      <>
        <rect x="5" y="5" width="14" height="14" rx="3" />
        <path d="M9 9h6v6H9zM9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4" />
      </>
    ),
    business: (
      <>
        <path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6M9 10h.01M15 10h.01" />
      </>
    ),
    language: (
      <>
        <path d="M4 5h12M10 3v2c0 6-3 10-7 12M6 10c1.5 3 4 5 7 6M15 13l3-8 3 8m-5-2h4" />
      </>
    ),
    learning: (
      <>
        <path d="M3 8 12 3l9 5-9 5-9-5Z" />
        <path d="M6 10v5c3.5 3 8.5 3 12 0v-5M21 8v7" />
      </>
    ),
    community: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 15a4.5 4.5 0 0 1 6.5 4" />
      </>
    ),
    commerce: (
      <>
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    partnership: (
      <>
        <path d="M8 12 5.5 9.5a2.1 2.1 0 0 1 3-3L12 10l3.5-3.5a2.1 2.1 0 0 1 3 3L16 12" />
        <path d="m8 12 4 4 4-4M12 16v5M5 21h14" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      {paths[type]}
    </svg>
  );
}

export default function OurWorkSection() {
  return (
    <section
      id="our-work"
      aria-labelledby="our-work-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#062D26] via-[#083B30] to-[#06271F] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 -z-10 h-96 w-96 rounded-full bg-[#A7E85A]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-[#65C8FF]/10 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <ScrollReveal3D as="div" direction="up">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#B8E85B]/30 bg-[#B8E85B]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D2F28D] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#B8E85B]" />
              Programs
            </span>

            <h2
              id="our-work-heading"
              className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] text-[#FFFDF5] sm:text-5xl lg:text-6xl"
            >
              Skills, technology
              <span className="block text-[#C4ED70]">
                and stronger communities.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#D5E9DD] sm:text-base">
              PSCDB’s framework brings together learning, digital services,
              enterprise support and community development to expand
              opportunities.
            </p>
          </div>
        </ScrollReveal3D>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {workAreas.map((area, index) => (
            <ScrollReveal3D
              key={area.number}
              direction={index % 2 === 0 ? "left" : "right"}
              delay={(index % 4) * 90}
              className="h-full"
            >
              <article
                style={{ "--work-accent": area.accent }}
                className="group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[1.7rem] border border-white/15 bg-gradient-to-br from-[#14503E] via-[#0D4034] to-[#0A342C] p-6 shadow-[0_22px_55px_-30px_rgba(0,0,0,0.75)] [transform-style:preserve-3d] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:border-[var(--work-accent)]/60 hover:shadow-[0_30px_70px_-32px_rgba(0,0,0,0.85)] hover:[transform:perspective(1100px)_rotateX(3deg)_rotateY(1deg)_translateY(-8px)_translateZ(10px)] motion-reduce:transition-none sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-15 blur-2xl transition duration-500 group-hover:scale-125 group-hover:opacity-35"
                  style={{ backgroundColor: area.accent }}
                />

                <div className="relative flex items-start justify-between">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-sm border border-white/10 bg-cream-50/[0.08]"
                    style={{ color: area.accent }}
                  >
                    <WorkIcon type={area.icon} />
                  </span>

                  <span className="text-xs font-bold tracking-[0.15em] text-white/45">
                    {area.number}
                  </span>
                </div>

                <p
                  className="relative mt-7 text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: area.accent }}
                >
                  {area.label}
                </p>

                <h3 className="relative mt-2 text-xl font-semibold leading-snug text-[#FFFDF5]">
                  {area.title}
                </h3>

                <p className="relative mt-3 text-sm leading-6 text-[#D5E5D9]">
                  {area.description}
                </p>

                <div className="relative mt-auto flex flex-wrap gap-2 pt-5">
                  {area.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-cream-50/[0.06] px-3 py-1.5 text-[11px] text-[#E1EBDF]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </ScrollReveal3D>
          ))}
        </div>

        <ScrollReveal3D as="div" direction="front" delay={120}>
          <div className="mt-10 flex flex-col gap-5 rounded-sm border border-[#C4ED70]/20 bg-[#0B362D]/85 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-lg font-semibold text-white">
                Explore learning pathways
              </p>
              <p className="mt-1 text-sm leading-6 text-[#D5E9DD]">
                Browse the program catalog and find an area to explore.
              </p>
            </div>

            <a
              href="/courses"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-[#C4ED70] px-6 text-sm font-bold text-[#123B2B] transition duration-300 hover:-translate-y-1 hover:bg-[#D7F69A] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4ED70]/40"
            >
              Explore programs
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </ScrollReveal3D>

        <p className="mx-auto mt-6 max-w-4xl text-center text-xs leading-6 text-[#AFC8B7]">
          Education partnerships, recognized institutions, degree-awarding
          activities and other regulated services are subject to the required
          approvals, licenses, recognition or accreditation.
        </p>
      </div>
    </section>
  );
}