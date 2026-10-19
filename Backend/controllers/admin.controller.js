import argon2 from "argon2";
import Admin from "../DBModels/Admin.js";
import Setting from "../DBModels/Setting.js";
import { ADMIN_COOKIE, adminCookieOptions, signAdmin } from "../middleware/adminAuth.js";
import { audit } from "../services/crud.js";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
let dummyHash;

export async function adminLogin(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const generic = { success: false, message: "Email or password is incorrect." };
  if (!email || !password || password.length > 200) return res.status(400).json(generic);

  const admin = await Admin.findOne({ email }).select("+passwordHash +failedLogins +lockedUntil");
  if (!admin || admin.active === false) {
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

  await Admin.updateOne({ _id: admin._id }, { $set: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await audit({ admin, ip: req.ip }, "login", "users", admin._id, admin.email);
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
  await audit(req, "settings", "settings", "site", `Exchange rate set to ${settings.pkrPerUsd}`);
  res.json({ success: true, data: settings });
}
