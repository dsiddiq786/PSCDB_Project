import programmes from "../Programmes/data/programmes.json";
import { labs } from "../Labs/labsData";

/* Static pages. Every href must match a route in src/App.jsx. */
const pages = [
  { title: "Home", href: "/", description: "PSCDB overview, labs and courses.", keywords: "home overview institute board" },
  { title: "AI Lab", href: "/labs/ai", description: "Explore, train and fine-tune large language models.", keywords: "ai artificial intelligence llm language model fine-tuning machine learning" },
  { title: "Cyber Security Lab", href: "/labs/cyber", description: "Attack, defend and investigate in isolated lab ranges.", keywords: "cyber security cybersecurity penetration testing soc forensics hacking" },
  { title: "Courses", href: "/courses", description: "Browse every advanced course and filter by lab.", keywords: "courses programs tracks catalog syllabus" },
  { title: "Admissions", href: "/admissions", description: "How to apply, entry requirements and the application process.", keywords: "admission apply application enroll enroll eligibility requirements intake" },
  { title: "Fees and Payments", href: "/fees", description: "How fees work, the fee for every course and how to pay online.", keywords: "fee fees payment payments pay bank transfer price cost" },
  { title: "About PSCDB", href: "/about", description: "Vision, mission, values and our code of conduct.", keywords: "about vision mission values conduct board history" },
  { title: "Leadership", href: "/leadership", description: "The people responsible for PSCDB.", keywords: "leadership leaders director ceo board team governance" },
  { title: "Careers", href: "/careers", description: "Career paths for graduates and how to register your interest.", keywords: "careers jobs employment placements opportunities internship" },
  { title: "Contact", href: "/contact", description: "Contact admissions, the office and send an inquiry.", keywords: "contact inquiry address email office location phone" },
];

function courseEntries() {
  return programmes.map((course) => ({
    type: "Course",
    title: course.title,
    description: course.summary,
    href: `/courses/${course.slug}`,
    keywords: [
      course.level,
      labs[course.lab]?.name,
      course.duration,
      course.format,
      ...course.tools,
      ...course.prerequisites,
      ...course.modules.map((m) => `${m.title} ${m.topics}`),
      ...course.outcomes,
    ].join(" "),
    weight: 3,
  }));
}

function labEntries() {
  return Object.values(labs).map((lab) => ({
    type: "Lab",
    title: lab.name,
    description: lab.headline,
    href: `/labs/${lab.slug}`,
    keywords: [lab.intro, ...lab.pillars.map((p) => `${p.title} ${p.text}`), ...lab.capabilities].join(" "),
    weight: 2,
  }));
}

const index = [
  ...pages.map((page) => ({ type: "Page", title: page.title, description: page.description, href: page.href, keywords: page.keywords, weight: 1 })),
  ...labEntries(),
  ...courseEntries(),
];

const tokenize = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/* Returns matches ranked by relevance. Every query word must appear somewhere in an entry. */
export function search(query, limit = 20) {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  return index
    .map((entry) => {
      const title = entry.title.toLowerCase();
      const haystack = `${title} ${entry.description} ${entry.keywords}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return null;

      const titleHits = terms.filter((term) => title.includes(term)).length;
      const score = titleHits * 10 + entry.weight;
      return { ...entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .filter((entry, position, all) => all.findIndex((other) => other.href === entry.href) === position)
    .slice(0, limit);
}

export const suggestions = ["LLM fine-tuning", "penetration testing", "digital forensics", "admissions", "fees", "leadership"];
