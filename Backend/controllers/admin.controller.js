import argon2 from "argon2";
import Admin from "../DBModels/Admin.js";
import Course from "../DBModels/Course.js";
import Enrolment from "../DBModels/Enrolment.js";
import Setting from "../DBModels/Setting.js";
import { ADMIN_COOKIE, adminCookieOptions, signAdmin } from "../middleware/adminAuth.js";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
let dummyHash;

export async function adminLogin(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const generic = { success: false, message: "Email or password is incorrect." };
  if (!email || !password || password.length > 200) return res.status(400).json(generic);

  const admin = await Admin.findOne({ email }).select("+passwordHash +failedLogins +lockedUntil");
  if (!admin) {
    // Spend the same time as a real check so unknown emails cannot be detected.
    dummyHash ??= await argon2.hash("not-a-real-password", { type: argon2.argon2id });
    await argon2.verify(dummyHash, password).catch(() => false);
    return res.status(401).json(generic);
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return res.status(429).json({ success: false, message: "Too many attempts. Please try again later." });
  }

  const valid = await argon2.verify(admin.passwordHash, password).catch(() => false);
  if (!valid) {
    // Atomic increment, so parallel attempts are all counted.
    const updated = await Admin.findOneAndUpdate({ _id: admin._id }, { $inc: { failedLogins: 1 } }, { new: true }).select("+failedLogins");
    if (updated.failedLogins >= MAX_FAILED) {
      await Admin.updateOne({ _id: admin._id }, { $set: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) } });
    }
    return res.status(401).json(generic);
  }

  await Admin.updateOne({ _id: admin._id }, { $set: { failedLogins: 0, lockedUntil: null } });
  res.cookie(ADMIN_COOKIE, signAdmin(admin), adminCookieOptions());
  res.json({ success: true, data: { name: admin.name, email: admin.email, role: admin.role } });
}

export function adminLogout(_req, res) {
  res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions(), maxAge: undefined });
  res.json({ success: true });
}

export function adminMe(req, res) {
  const { name, email, role } = req.admin;
  res.json({ success: true, data: { name, email, role } });
}

export async function adminOverview(_req, res) {
  const [courses, byStatus, recent] = await Promise.all([
    Course.find({}, { code: 1, title: 1, batches: 1 }).sort({ code: 1 }).lean(),
    Enrolment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, totalUsdCents: { $sum: "$totalUsdCents" } } }]),
    Enrolment.find({}).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  res.json({ success: true, data: { courses, byStatus, recent } });
}

export async function adminListEnrolments(req, res) {
  const status = ["pending_payment", "paid", "expired", "cancelled"].includes(req.query.status) ? req.query.status : undefined;
  const filter = status ? { status } : {};
  const enrolments = await Enrolment.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.json({ success: true, data: enrolments });
}

export async function adminListCourses(_req, res) {
  const courses = await Course.find({}).sort({ code: 1 }).lean();
  res.json({ success: true, data: courses });
}

const money = (value) => (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100000 ? Math.round(value * 100) : null);

export async function adminUpdateCourse(req, res) {
  const code = String(req.params.code).toUpperCase();
  const course = await Course.findOne({ code }).lean();
  if (!course) return res.status(404).json({ success: false, message: "Course not found." });

  const body = req.body || {};
  const set = {};
  if ("feeUsd" in body) {
    const cents = money(body.feeUsd);
    if (cents === null) return res.status(400).json({ success: false, message: "Enter a valid course fee." });
    set.feeUsdCents = cents;
  }
  if ("examFeeUsd" in body) {
    const cents = money(body.examFeeUsd);
    if (cents === null) return res.status(400).json({ success: false, message: "Enter a valid exam fee." });
    set.examFeeUsdCents = cents;
  }
  if ("examIncludedByInstitute" in body) set.examIncludedByInstitute = Boolean(body.examIncludedByInstitute);
  if ("published" in body) set.published = Boolean(body.published);
  if (Object.keys(set).length) await Course.updateOne({ code }, { $set: set });

  if (Array.isArray(body.batches)) {
    for (const change of body.batches) {
      const batch = course.batches.find((item) => item.id === change?.id);
      if (!batch) continue;
      if (typeof change.timing === "string") {
        await Course.updateOne({ code, "batches.id": batch.id }, { $set: { "batches.$.timing": change.timing.trim().slice(0, 80) } });
      }
      if (Number.isInteger(change.capacity) && change.capacity >= 0 && change.capacity <= 1000 && change.capacity !== batch.capacity) {
        const delta = change.capacity - batch.capacity;
        // Atomic: capacity and free seats move together, and free seats never go below zero.
        const result = await Course.updateOne(
          { code, batches: { $elemMatch: { id: batch.id, capacity: batch.capacity, seatsAvailable: { $gte: -delta } } } },
          { $inc: { "batches.$.capacity": delta, "batches.$.seatsAvailable": delta } },
        );
        if (result.modifiedCount !== 1) {
          return res.status(409).json({ success: false, message: `${batch.label} could not be resized because seats are already booked or it changed. Refresh and try again.` });
        }
      }
    }
  }

  const updated = await Course.findOne({ code }).lean();
  res.json({ success: true, data: updated });
}

export async function adminGetSettings(_req, res) {
  const settings = await Setting.findOne({ key: "site" }).lean();
  res.json({ success: true, data: settings });
}

export async function adminUpdateSettings(req, res) {
  const rate = req.body?.pkrPerUsd;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 1 || rate > 100000) {
    return res.status(400).json({ success: false, message: "Enter a valid exchange rate." });
  }
  const settings = await Setting.findOneAndUpdate(
    { key: "site" },
    { $set: { pkrPerUsd: Math.round(rate * 100) / 100, updatedBy: req.admin.email } },
    { new: true, upsert: true },
  );
  res.json({ success: true, data: settings });
}
