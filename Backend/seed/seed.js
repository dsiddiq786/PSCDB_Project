import argon2 from "argon2";
import Course from "../DBModels/Course.js";
import Setting from "../DBModels/Setting.js";
import Admin from "../DBModels/Admin.js";
import Centre from "../DBModels/Centre.js";
import Shift from "../DBModels/Shift.js";

const batches = () => [
  { id: "morning", label: "Morning Batch", timing: "", capacity: 50, seatsAvailable: 50 },
  { id: "evening", label: "Evening Batch", timing: "", capacity: 50, seatsAvailable: 50 },
];

/* Approved starting fees. Administrators can change them later. */
export const seedCourses = [
  { slug: "machine-learning-foundations", code: "AI-101", title: "Applied Machine Learning Foundations", lab: "ai", level: "Beginner", duration: "8 weeks", feeUsdCents: 3500 },
  { slug: "web-application-security", code: "CY-301", title: "Web Application Security", lab: "cyber", level: "Intermediate", duration: "8 weeks", feeUsdCents: 4500 },
  { slug: "digital-forensics-and-incident-response", code: "CY-303", title: "Digital Forensics and Incident Response", lab: "cyber", level: "Intermediate", duration: "8 weeks", feeUsdCents: 4500 },
  { slug: "security-operations-and-threat-hunting", code: "CY-302", title: "Security Operations and Threat Hunting", lab: "cyber", level: "Intermediate", duration: "10 weeks", feeUsdCents: 5000 },
  { slug: "ai-security-and-red-teaming", code: "AI-401", title: "AI Security and Red Teaming", lab: "ai", level: "Advanced", duration: "8 weeks", feeUsdCents: 5500 },
  { slug: "llm-engineering-and-fine-tuning", code: "AI-301", title: "LLM Engineering and Fine-Tuning", lab: "ai", level: "Advanced", duration: "12 weeks", feeUsdCents: 6500 },
  { slug: "penetration-testing-professional", code: "CY-401", title: "Penetration Testing Professional", lab: "cyber", level: "Advanced", duration: "12 weeks", feeUsdCents: 6500 },
];

/* Default shifts. Times are starting values that administrators should confirm. */
const seedShifts = [
  { code: "morning", name: "Morning", startTime: "09:00", endTime: "13:00" },
  { code: "evening", name: "Evening", startTime: "17:00", endTime: "21:00" },
];

/* Inserts only what is missing, so changes made by administrators are kept. */
export async function runSeed() {
  for (const shift of seedShifts) {
    await Shift.updateOne({ code: shift.code }, { $setOnInsert: { ...shift, days: ["mon", "tue", "wed", "thu", "fri"], graceMinutes: 15, active: true } }, { upsert: true });
  }
  await Centre.updateOne(
    { code: "sahiwal" },
    { $setOnInsert: { code: "sahiwal", name: "Sahiwal Center", city: "Sahiwal", address: "Office No. 11, 1st Floor, Star Complex, Stadium Road, Sahiwal, Pakistan", phone: "", active: true } },
    { upsert: true },
  );

  for (const course of seedCourses) {
    await Course.updateOne(
      { slug: course.slug },
      { $setOnInsert: { ...course, centre: "sahiwal", examFeeUsdCents: 9000, examIncludedByInstitute: false, batches: batches(), published: true } },
      { upsert: true },
    );
  }

  await Setting.updateOne(
    { key: "site" },
    { $setOnInsert: { key: "site", pkrPerUsd: Number(process.env.DEFAULT_PKR_PER_USD) || 277 } },
    { upsert: true },
  );

  // Earlier releases named the first center "Sahiwal Centre"; use the American spelling.
  await Centre.updateOne({ code: "sahiwal", name: "Sahiwal Centre" }, { $set: { name: "Sahiwal Center" } });

  // Batch names are shown as titles: "Morning batch" becomes "Morning Batch".
  for (const course of await Course.find({ "batches.label": / batch$/ }, { batches: 1 }).lean()) {
    for (const batch of course.batches) {
      if (/ batch$/.test(batch.label)) {
        await Course.updateOne({ _id: course._id, "batches.id": batch.id }, { $set: { "batches.$.label": batch.label.replace(/ batch$/, " Batch") } });
      }
    }
  }

  const adminCount = await Admin.countDocuments();
  if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    }
    const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    await Admin.create({ email: process.env.ADMIN_EMAIL, name: process.env.ADMIN_NAME || "Administrator", passwordHash, role: "superadmin" });
    console.log("Created the first superadmin from ADMIN_EMAIL.");
  }
}
