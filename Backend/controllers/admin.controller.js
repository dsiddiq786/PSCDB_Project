import argon2 from "argon2";
import Admin from "../DBModels/Admin.js";
import Setting from "../DBModels/Setting.js";
import { ADMIN_COOKIE, adminCookieOptions, readAdminId, signAdmin } from "../middleware/adminAuth.js";
import { audit } from "../services/crud.js";
import { avatarUrl } from "../admin/profile.js";

const MAX_FAILED = 5;
const WINDOW_MS = 15 * 60 * 1000;
const HASH_OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
let dummyHash;

/* Failed sign-ins are counted per email and IP address, so an attacker elsewhere cannot lock a real
   user out. Kept in memory: the API runs as a single process. */
const failures = new Map();
function failureCount(key) {
  const entry = failures.get(key);
  if (!entry || entry.until < Date.now()) {
    failures.delete(key);
    return 0;
  }
  return entry.count;
}
function recordFailure(key) {
  const count = failureCount(key) + 1;
  failures.set(key, { count, until: Date.now() + WINDOW_MS });
  if (failures.size > 10000) failures.delete(failures.keys().next().value);
}

export async function adminLogin(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const generic = { success: false, message: "Email or password is incorrect." };
  if (!email || !password || password.length > 200 || email.length > 254) return res.status(400).json(generic);

  const key = `${email}|${req.ip}`;
  const blocked = failureCount(key) >= MAX_FAILED;
  const admin = blocked ? null : await Admin.findOne({ email }).select("+passwordHash +tokenVersion");
  // Unknown, disabled and temporarily blocked accounts all take the same time and get the same answer.
  if (!admin || admin.active === false) {
    dummyHash ??= await argon2.hash("not-a-real-password", HASH_OPTIONS);
    await argon2.verify(dummyHash, password).catch(() => false);
    recordFailure(key);
    return res.status(401).json(generic);
  }

  const valid = await argon2.verify(admin.passwordHash, password).catch(() => false);
  if (!valid) {
    recordFailure(key);
    return res.status(401).json(generic);
  }

  failures.delete(key);
  await Admin.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
  await audit({ admin, ip: req.ip }, "login", "users", admin._id, admin.email);
  res.cookie(ADMIN_COOKIE, signAdmin(admin), adminCookieOptions());
  res.json({ success: true, data: { id: String(admin._id), name: admin.name, email: admin.email, role: admin.role, jobTitle: admin.jobTitle || "", avatarUrl: avatarUrl(admin.avatar) } });
}

/* Signing out ends every session of this account, on every device. */
export async function adminLogout(req, res) {
  const id = readAdminId(req);
  if (id) await Admin.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } }).catch(() => {});
  res.clearCookie(ADMIN_COOKIE, { ...adminCookieOptions(), maxAge: undefined });
  res.json({ success: true });
}

export function adminMe(req, res) {
  const { _id, name, email, role, jobTitle = "", avatar } = req.admin;
  res.json({ success: true, data: { id: String(_id), name, email, role, jobTitle, avatarUrl: avatarUrl(avatar) } });
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
    { returnDocument: "after", upsert: true },
  );
  await audit(req, "settings", "settings", "site", `Exchange rate set to ${settings.pkrPerUsd}`);
  res.json({ success: true, data: settings });
}
