import Certification from "../DBModels/Certification.js";
import Course from "../DBModels/Course.js";
import Institute from "../DBModels/Institute.js";
import Lab from "../DBModels/Lab.js";
import NavItem from "../DBModels/NavItem.js";
import SiteSection from "../DBModels/SiteSection.js";
import { logoUrl } from "../admin/media.js";

/* Public website data from the database: menu, editable sections, labs, institutes and
   certification summaries. Only active and visible records are returned. */

const money = (cents) => (cents === null || cents === undefined ? null : cents / 100);

function examFee(fee = {}) {
  return {
    amount: money(fee.amountCents),
    currency: fee.currency || "USD",
    region: fee.region || "",
    sourceUrl: fee.sourceUrl || "",
    verifiedAt: fee.verifiedAt || null,
    notes: fee.notes || "",
  };
}

const instituteOut = (i) => ({
  slug: i.slug,
  name: i.name,
  shortName: i.shortName || i.name,
  website: i.website,
  description: i.description,
  logoUrl: logoUrl(i.logo),
  partnershipVerified: Boolean(i.partnershipVerified),
  partnershipNote: i.partnershipVerified ? i.partnershipNote : "",
  showInStrip: i.showInStrip,
  showInNav: i.showInNav,
  order: i.order,
});

function certificationSummary(c, instituteSlug, courseSlugs) {
  return {
    slug: c.slug,
    code: c.code,
    title: c.title,
    category: c.category,
    level: c.level,
    institute: instituteSlug,
    examFee: examFee(c.examFee),
    prepFeeUsd: money(c.prepFeeUsdCents),
    prepIncludesExam: Boolean(c.prepIncludesExam),
    prepDuration: c.prepDuration,
    courses: courseSlugs,
    featured: Boolean(c.featured),
    order: c.order,
  };
}

async function loadCore() {
  const [institutes, certs, courses] = await Promise.all([
    Institute.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Certification.find({ active: true }).sort({ order: 1, title: 1 }).lean(),
    Course.find({ published: true }, { slug: 1, code: 1, title: 1, lab: 1 }).sort({ code: 1 }).lean(),
  ]);
  const instituteById = new Map(institutes.map((i) => [String(i._id), i]));
  const courseById = new Map(courses.map((c) => [String(c._id), c]));
  return { institutes, certs: certs.filter((c) => instituteById.has(String(c.institute))), courses, instituteById, courseById };
}

export async function siteData(_req, res) {
  const [{ institutes, certs, courses, instituteById, courseById }, labs, sections, nav] = await Promise.all([
    loadCore(),
    Lab.find({ visible: true }).sort({ order: 1, name: 1 }).lean(),
    SiteSection.find({}).lean(),
    NavItem.find({ visible: true }).sort({ order: 1, label: 1 }).lean(),
  ]);

  // Build the two-level menu; sub-items of a hidden parent are dropped.
  const top = nav.filter((n) => !n.parent);
  const menu = top.map((n) => ({
    label: n.label,
    kind: n.kind,
    href: n.href || (n.kind === "certifications" ? "/certifications" : n.kind === "labs" ? "/labs/ai" : "/"),
    children: nav.filter((c) => String(c.parent) === String(n._id)).map((c) => ({ label: c.label, href: c.href })),
  }));

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({
    success: true,
    data: {
      menu,
      sections: Object.fromEntries(sections.map((s) => [s.key, { eyebrow: s.eyebrow, title: s.title, subtitle: s.subtitle, body: s.body, bullets: s.bullets, ctaLabel: s.ctaLabel, ctaHref: s.ctaHref, visible: s.visible, logoOpacity: s.logoOpacity, grayscale: s.grayscale, logoHeight: s.logoHeight, maxItems: s.maxItems }])),
      labs: labs.map((l) => ({
        slug: l.slug,
        name: l.name,
        shortName: l.shortName,
        category: l.category,
        headline: l.headline,
        intro: l.intro,
        pillars: l.pillars.map((p) => ({ title: p.title, text: p.text })),
        capabilities: l.capabilities,
        courses: courses.filter((c) => c.lab === l.slug).map((c) => ({ slug: c.slug, code: c.code, title: c.title })),
      })),
      institutes: institutes.map(instituteOut),
      certifications: certs.map((c) =>
        certificationSummary(c, instituteById.get(String(c.institute)).slug, c.courses.map((id) => courseById.get(String(id))?.slug).filter(Boolean)),
      ),
    },
  });
}

export async function certificationDetail(req, res) {
  const slug = String(req.params.slug || "").toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return res.status(404).json({ success: false, message: "Certification not found." });
  const c = await Certification.findOne({ slug, active: true }).lean();
  const institute = c && (await Institute.findOne({ _id: c.institute, active: true }).lean());
  if (!c || !institute) return res.status(404).json({ success: false, message: "Certification not found." });
  const courses = await Course.find({ _id: { $in: c.courses }, published: true }, { slug: 1, code: 1, title: 1, lab: 1, level: 1, duration: 1, feeUsdCents: 1 }).lean();
  res.json({
    success: true,
    data: {
      ...certificationSummary(c, institute.slug, courses.map((x) => x.slug)),
      description: c.description,
      officialUrl: c.officialUrl,
      prerequisites: c.prerequisites,
      objectives: c.objectives.map((o) => ({ title: o.title, weight: o.weight })),
      exam: c.exam,
      labs: c.labs,
      curriculum: c.curriculum,
      institute: instituteOut(institute),
      relatedCourses: courses.map((x) => ({ slug: x.slug, code: x.code, title: x.title, lab: x.lab, level: x.level, duration: x.duration, feeUsd: x.feeUsdCents / 100 })),
    },
  });
}
