import { readFile } from "node:fs/promises";
import Certification from "../DBModels/Certification.js";
import Counter from "../DBModels/Counter.js";
import Course from "../DBModels/Course.js";
import Institute from "../DBModels/Institute.js";
import { saveLogo } from "../admin/media.js";

/* One-time import of the researched certification data (seed/certifications.json, verified from
   official provider pages on the date recorded in each fee). It runs once per database: after
   that, institutes, certifications, logos and prices are managed only in the admin panel. */

const MARKER = "import:certifications-2026-10";

export async function importCertifications() {
  const file = new URL("./certifications.json", import.meta.url);
  let data;
  try {
    data = JSON.parse(await readFile(file, "utf8"));
  } catch {
    return; // No data file: nothing to import.
  }
  // Atomic "run once": only the process that creates the marker imports.
  const marker = await Counter.updateOne({ _id: MARKER }, { $setOnInsert: { seq: 1 } }, { upsert: true });
  if (!marker.upsertedCount) return;

  const courses = new Map((await Course.find({}, { slug: 1 }).lean()).map((c) => [c.slug, c._id]));
  let instituteCount = 0;
  let certificationCount = 0;
  for (const [index, entry] of data.institutes.entries()) {
    let logo = "";
    if (entry.logoFile) {
      try {
        logo = await saveLogo(await readFile(new URL(`./logos/${entry.logoFile}`, import.meta.url)));
      } catch (err) {
        console.error(`Logo for ${entry.name} not imported:`, err.message);
      }
    }
    const institute = await Institute.findOneAndUpdate(
      { slug: entry.slug },
      {
        $setOnInsert: {
          slug: entry.slug,
          name: entry.name,
          shortName: entry.shortName || "",
          website: entry.website || "",
          description: entry.description || "",
          logo,
          logoSource: entry.logoSource || "",
          partnershipVerified: false,
          showInStrip: entry.showInStrip !== false,
          showInNav: entry.showInNav !== false,
          order: entry.order ?? (index + 1) * 10,
          active: true,
        },
      },
      { upsert: true, returnDocument: "after" },
    ).lean();
    instituteCount += 1;

    for (const [certIndex, cert] of (entry.certifications || []).entries()) {
      const amount = cert.examFee?.amount;
      const examFeeCents = typeof amount === "number" ? Math.round(amount * 100) : null;
      // The preparation fee starts equal to the official exam fee when that fee is in US dollars.
      const prepFee = cert.prepFeeUsd !== undefined ? cert.prepFeeUsd : cert.examFee?.currency === "USD" ? amount : null;
      await Certification.updateOne(
        { slug: cert.slug },
        {
          $setOnInsert: {
            institute: institute._id,
            slug: cert.slug,
            code: cert.code || "",
            title: cert.title,
            category: cert.category,
            level: cert.level || "",
            description: cert.description || "",
            officialUrl: cert.officialUrl || "",
            prerequisites: cert.prerequisites || [],
            objectives: (cert.objectives || []).map((o) => ({ title: o.title, weight: o.weight || "" })),
            exam: {
              format: cert.exam?.format || "",
              questions: cert.exam?.questions == null ? "" : String(cert.exam.questions),
              durationMinutes: cert.exam?.durationMinutes ?? null,
              passingScore: cert.exam?.passingScore || "",
              languages: Array.isArray(cert.exam?.languages) ? cert.exam.languages.join(", ") : cert.exam?.languages || "",
              delivery: cert.exam?.delivery || "",
            },
            examFee: {
              amountCents: examFeeCents,
              currency: cert.examFee?.currency || "USD",
              region: cert.examFee?.region || "",
              sourceUrl: cert.examFee?.sourceUrl || "",
              verifiedAt: cert.examFee?.verifiedAt ? new Date(cert.examFee.verifiedAt) : null,
              notes: cert.examFee?.notes || "",
            },
            prepFeeUsdCents: typeof prepFee === "number" ? Math.round(prepFee * 100) : null,
            prepIncludesExam: false,
            prepDuration: cert.prepDuration || "",
            labs: cert.labs || [],
            curriculum: cert.curriculum || [],
            courses: (cert.courseSlugs || []).map((slug) => courses.get(slug)).filter(Boolean),
            featured: Boolean(cert.featured),
            order: cert.order ?? (certIndex + 1) * 10,
            active: true,
            sources: cert.sources || [],
            notes: cert.notes || "",
          },
        },
        { upsert: true },
      );
      certificationCount += 1;
    }
  }
  console.log(`Imported ${instituteCount} certification institutes and ${certificationCount} certifications.`);
}
