import { readFile } from "node:fs/promises";
import Lab from "../DBModels/Lab.js";
import NavItem from "../DBModels/NavItem.js";
import SiteSection from "../DBModels/SiteSection.js";

/* Starting content for the database-driven website. Each item is inserted only if it is
   missing, so anything changed in the admin panel is never overwritten. */

const sections = [
  {
    key: "home_institutes",
    name: "Homepage: Certification Institutes",
    eyebrow: "Certification Pathways",
    title: "Prepare for Globally Recognized Certifications",
    subtitle: "Industry-aligned training. Real-world labs. International certification pathways.",
    body: "Certification names and logos belong to their owners. PSCDB prepares students for these exams and is not an official partner of any provider unless this is stated.",
    ctaLabel: "View Certifications",
    ctaHref: "/certifications",
    logoOpacity: 55,
    grayscale: true,
    logoHeight: 30,
    maxItems: 14,
  },
  {
    key: "home_featured_certifications",
    name: "Homepage: Featured Certifications",
    eyebrow: "Featured Certifications",
    title: "Certifications Our Students Prepare For",
    subtitle: "Hands-on preparation at PSCDB, followed by the official exam with the certification provider.",
    ctaLabel: "View All Certifications",
    ctaHref: "/certifications",
    maxItems: 6,
  },
  {
    key: "certifications_page",
    name: "Certifications Page",
    eyebrow: "Certifications",
    title: "International Certification Preparation",
    subtitle: "Choose an institute and a certification to see its exam objectives, the official exam fee and PSCDB's hands-on preparation.",
  },
  {
    key: "certification_disclaimer",
    name: "Certification Statement and Disclaimer",
    title: "How Certification Preparation Works",
    body: "PSCDB emphasizes practical, hands-on training through real-world labs and industry-relevant projects, helping students develop job-ready skills while preparing for internationally recognized certifications.",
    bullets: [
      "PSCDB training and the official certification exams are separate.",
      "Certification exams are administered by the external providers, not by PSCDB.",
      "Official exam fees are set by the providers and may change. Check the provider's website before you register.",
      "The PSCDB preparation fee covers training and labs. It does not include exam registration unless this is stated for a certification.",
      "Passing a certification exam is not guaranteed.",
      "Showing a provider's name or logo does not mean PSCDB is its official partner or is accredited by it.",
    ],
  },
];

const menu = [
  { label: "Courses", kind: "link", href: "/courses", order: 10 },
  { label: "Labs", kind: "labs", href: "/labs/ai", order: 20 },
  { label: "Certifications", kind: "certifications", href: "/certifications", order: 30 },
  { label: "Admissions", kind: "link", href: "/admissions", order: 40 },
  { label: "Fees", kind: "link", href: "/fees", order: 50 },
  { label: "About", kind: "link", href: "/about", order: 60 },
];

export async function seedSite() {
  for (const section of sections) {
    await SiteSection.updateOne({ key: section.key }, { $setOnInsert: section }, { upsert: true });
  }
  // The menu is created once; after that it belongs to the admin panel.
  if ((await NavItem.estimatedDocumentCount()) === 0) await NavItem.insertMany(menu);
  const labs = JSON.parse(await readFile(new URL("./labs.json", import.meta.url), "utf8"));
  for (const lab of labs) {
    await Lab.updateOne({ slug: lab.slug }, { $setOnInsert: lab }, { upsert: true });
  }
}
