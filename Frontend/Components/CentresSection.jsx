import ScrollReveal3D from "./ScrollReveal3D";

const centres = [
  {
    number: "01",
    name: "Regional Skills Center",
    location: "Approved location",
    description:
      "A place to explore practical training and skills development.",
    focus: "Training & learning",
    href: "/centres/regional-skills-centre",
    theme: "from-[#dcece5] via-[#edf4ef] to-[#f7f5ef]",
    accent: "#167a62",
    hover:
      "hover:[transform:perspective(1100px)_rotateX(4deg)_rotateY(-5deg)_translateY(-8px)_translateZ(18px)]",
    direction: "left",
  },
  {
    number: "02",
    name: "Community Learning Center",
    location: "Approved location",
    description:
      "A community setting for learning, connection and guidance.",
    focus: "Mentorship & community",
    href: "/centres/community-learning-centre",
    theme: "from-[#f2ead5] via-[#f7f2e6] to-[#f7f5ef]",
    accent: "#ad8633",
    hover:
      "hover:[transform:perspective(1100px)_rotateX(5deg)_rotateY(0deg)_translateY(-10px)_translateZ(22px)]",
    direction: "front",
  },
  {
    number: "03",
    name: "Career Development Center",
    location: "Approved location",
    description:
      "A link between developing skills and finding future opportunities.",
    focus: "Careers & opportunity",
    href: "/centres/career-development-centre",
    theme: "from-[#dfe8f2] via-[#eef2f7] to-[#f7f5ef]",
    accent: "#315f9d",
    hover:
      "hover:[transform:perspective(1100px)_rotateX(4deg)_rotateY(5deg)_translateY(-8px)_translateZ(18px)]",
    direction: "right",
  },
];

function CentreIllustration({ accent }) {
  return (
    <svg
      aria-hidden="true"
      className="h-20 w-20 transition-transform duration-500 group-hover:scale-110 group-hover:[transform:translateZ(32px)_rotateY(8deg)]"
      viewBox="0 0 96 96"
      fill="none"
    >
      <path
        d="M17 40 48 20l31 20v37H17V40Z"
        fill="white"
        fillOpacity=".78"
        stroke={accent}
        strokeWidth="2"
      />
      <path d="M11 41 48 16l37 25" stroke={accent} strokeWidth="3" />
      <path
        d="M27 48h12v12H27zM57 48h12v12H57zM40 61h16v16H40z"
        fill={accent}
        fillOpacity=".2"
        stroke={accent}
        strokeWidth="2"
      />
      <path d="M12 79h72" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function CentresSection() {
  return (
    <section
      id="centres"
      aria-labelledby="centres-heading"
      className="overflow-hidden bg-cream-50 px-5 py-20 text-[#18231f] sm:px-8 sm:py-24 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <ScrollReveal3D
              as="p"
              direction="left"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[#167a62] sm:text-sm"
            >
              Closer to your community
            </ScrollReveal3D>

            <ScrollReveal3D
              as="h2"
              direction="front"
              delay={100}
              className="mt-4 text-balance text-3xl font-semibold tracking-[-0.035em] text-[#123b32] sm:text-4xl lg:text-5xl"
            >
              Our Centers
            </ScrollReveal3D>

            <ScrollReveal3D
              as="p"
              direction="right"
              delay={180}
              className="mt-4 max-w-xl text-pretty text-sm leading-7 text-[#64716a] sm:text-base"
            >
              Explore PSCDB learning and community spaces designed to connect
              skills, guidance and opportunity.
            </ScrollReveal3D>
          </div>

          <ScrollReveal3D direction="up" delay={220}>
            <a
              href="/centres"
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-[#123b32]/15 px-5 text-sm font-bold text-[#123b32] transition-colors hover:border-[#167a62]/40 hover:bg-[#f3f7f4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#167a62]"
            >
              View all centers
              <span aria-hidden="true" className="text-[#167a62]">
                ↗
              </span>
            </a>
          </ScrollReveal3D>
        </div>

        <div className="mt-11 grid gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {centres.map((centre, index) => (
            <ScrollReveal3D
              key={centre.number}
              direction={centre.direction}
              delay={index * 130}
              className="h-full"
            >
              <a
                href={centre.href}
                style={{ "--centre-accent": centre.accent }}
                className={`group block h-full overflow-hidden rounded-[1.6rem] border border-[#123b32]/10 bg-cream-50 shadow-[0_18px_50px_-35px_rgba(18,59,50,0.45)] [transform:perspective(1100px)_rotateX(0deg)_rotateY(0deg)] [transform-style:preserve-3d] transition-[transform,box-shadow,border-color] duration-500 ease-out hover:border-[#167a62]/30 hover:shadow-[0_30px_65px_-34px_rgba(18,59,50,0.35)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#167a62] motion-reduce:transition-none ${centre.hover}`}
              >
                <div
                  className={`relative grid h-48 place-items-center overflow-hidden bg-gradient-to-br ${centre.theme}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/70 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full border border-white/70 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12"
                  />

                  <span
                    className="relative grid h-32 w-32 place-items-center rounded-full border border-white/80 bg-cream-50/55 shadow-[0_18px_38px_-22px_rgba(18,59,50,0.32)] backdrop-blur-sm [transform:translateZ(20px)] transition-transform duration-500 group-hover:[transform:translateZ(48px)_rotateY(8deg)]"
                    style={{ color: centre.accent }}
                  >
                    <CentreIllustration accent={centre.accent} />
                  </span>

                  <span className="absolute left-5 top-5 rounded-full border border-white/70 bg-cream-50/70 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#40564d] backdrop-blur">
                    CENTRE {centre.number}
                  </span>
                </div>

                <div className="p-6 sm:p-7">
                  <span className="inline-flex rounded-full bg-[#f3f7f4] px-3 py-1 text-[11px] font-bold text-[#167a62]">
                    {centre.focus}
                  </span>

                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-[#123b32]">
                    {centre.name}
                  </h3>

                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-[#77827c]">
                    <MapPinIcon />
                    {centre.location}
                  </p>

                  <p className="mt-4 min-h-14 text-sm leading-6 text-[#64716a]">
                    {centre.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#167a62]">
                    Explore center
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </div>
              </a>
            </ScrollReveal3D>
          ))}
        </div>
      </div>
    </section>
  );
}