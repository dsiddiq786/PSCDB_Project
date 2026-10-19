import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import argon2 from "argon2";
import mongoose from "mongoose";
import multer from "multer";
import sharp from "sharp";
import Admin from "../DBModels/Admin.js";
import Attendance from "../DBModels/Attendance.js";
import AuditLog from "../DBModels/AuditLog.js";
import Staff from "../DBModels/Staff.js";
import Student from "../DBModels/Student.js";
import { ADMIN_COOKIE, adminCookieOptions, signAdmin } from "../middleware/adminAuth.js";
import { HttpError, audit, canDo } from "../services/crud.js";
import { properName } from "../services/names.js";

export const AVATAR_DIR = fileURLToPath(new URL("../uploads/avatars/", import.meta.url));
const AVATAR_NAME = /^[a-f0-9]{32}\.webp$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

/* Profile pictures are read into memory (2 MB at most), checked by decoding them, and re-encoded. */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 },
}).single("avatar");

/* Decodes the upload as an image, crops it square, strips all metadata and stores it as WebP. */
async function saveAvatar(file) {
  if (!file?.buffer?.length) throw new HttpError(400, "Choose an image to upload.", "avatar");
  let output;
  try {
    const image = sharp(file.buffer, { limitInputPixels: 40_000_000, failOn: "error" });
    const { format } = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(format)) throw new Error("unsupported");
    // Re-encoding drops EXIF data such as GPS location.
    output = await image.rotate().resize(320, 320, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw new HttpError(400, "Upload a JPG, PNG or WebP image.", "avatar");
  }
  await mkdir(AVATAR_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.webp`;
  await writeFile(path.join(AVATAR_DIR, name), output, { flag: "wx" });
  return name;
}

export async function removeAvatarFile(name) {
  if (name && AVATAR_NAME.test(name)) await unlink(path.join(AVATAR_DIR, name)).catch(() => {});
}

export const avatarUrl = (name) => (name && AVATAR_NAME.test(name) ? `/api/v1/admin/avatars/${name}` : "");

/* Serves a profile picture to signed-in staff only. */
export async function serveAvatar(req, res) {
  const name = String(req.params.name || "");
  if (!AVATAR_NAME.test(name)) throw new HttpError(404, "Not found.");
  res.setHeader("Cache-Control", "private, max-age=86400");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(name, { root: AVATAR_DIR, dotfiles: "deny" }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, message: "Not found." });
  });
}

/* ------------------------------------------------------------------ My profile */

function myProfile(admin, staff, activity) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    phone: admin.phone || "",
    jobTitle: admin.jobTitle || "",
    avatarUrl: avatarUrl(admin.avatar),
    active: admin.active !== false,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    staff: staff && {
      id: String(staff._id),
      staffId: staff.staffId,
      role: staff.role,
      department: staff.department,
      shift: staff.shift,
      centre: staff.centre,
      status: staff.status,
      joinedOn: staff.joinedOn,
    },
    activity: activity.map((a) => ({ id: String(a._id), action: a.action, resource: a.resource, summary: a.summary, createdAt: a.createdAt })),
  };
}

export async function getMyProfile(req, res) {
  const admin = await Admin.findById(req.admin._id).lean();
  const [staff, activity] = await Promise.all([
    Staff.findOne({ email: admin.email }).lean(),
    AuditLog.find({ actor: admin.email }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);
  res.json({ success: true, data: myProfile(admin, staff, activity) });
}

export async function updateMyProfile(req, res) {
  const body = req.body || {};
  const set = {};
  if ("name" in body) {
    const name = typeof body.name === "string" ? properName(body.name) : "";
    if (!/^[\p{L}][\p{L} .'-]{1,99}$/u.test(name)) throw new HttpError(400, "Enter your full name.", "name");
    set.name = name;
  }
  if ("phone" in body) {
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (phone && !PHONE.test(phone)) throw new HttpError(400, "Enter a valid phone number.", "phone");
    set.phone = phone;
  }
  if ("jobTitle" in body) {
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
    if (jobTitle.length > 80) throw new HttpError(400, "Use 80 characters or fewer.", "jobTitle");
    set.jobTitle = jobTitle;
  }
  if (!Object.keys(set).length) throw new HttpError(400, "Nothing to update.");
  await Admin.updateOne({ _id: req.admin._id }, { $set: set });
  await audit(req, "update", "profile", req.admin._id, `Updated ${Object.keys(set).join(", ")}`);
  return getMyProfile(req, res);
}

/* Changes the signed-in user's password after checking the current one, then signs out every other session. */
export async function changeMyPassword(req, res) {
  const current = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const next = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!current) throw new HttpError(400, "Enter your current password.", "currentPassword");
  if (next.length < 12 || next.length > 200) throw new HttpError(400, "Use at least 12 characters.", "newPassword");
  if (next === current) throw new HttpError(400, "Choose a password you have not used here before.", "newPassword");

  const admin = await Admin.findById(req.admin._id).select("+passwordHash +tokenVersion");
  const valid = await argon2.verify(admin.passwordHash, current).catch(() => false);
  if (!valid) {
    await audit(req, "update", "profile", admin._id, "Password change refused: wrong current password");
    throw new HttpError(400, "Your current password is not correct.", "currentPassword");
  }
  admin.passwordHash = await argon2.hash(next, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();
  // Keep this browser signed in with a fresh session; every other session is now invalid.
  res.cookie(ADMIN_COOKIE, signAdmin(admin), adminCookieOptions());
  await audit(req, "update", "profile", admin._id, "Changed password");
  res.json({ success: true, message: "Password changed. Other devices have been signed out." });
}

/* ------------------------------------------------------------------ Profile pictures */

const AVATAR_OWNERS = {
  me: { model: Admin, role: "staff" },
  users: { model: Admin, role: "superadmin" },
  staff: { model: Staff, role: "manager" },
  students: { model: Student, role: "staff" },
};

function ownerFor(req) {
  const kind = req.params.kind || "me";
  const owner = Object.hasOwn(AVATAR_OWNERS, kind) ? AVATAR_OWNERS[kind] : null;
  if (!owner) throw new HttpError(404, "Not found.");
  if (!canDo(req.admin, owner.role)) throw new HttpError(403, "You do not have permission to do this.");
  const id = kind === "me" ? req.admin._id : req.params.id;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Record not found.");
  return { ...owner, kind, id };
}

export async function uploadAvatar(req, res) {
  const owner = ownerFor(req);
  const doc = await owner.model.findById(owner.id).lean();
  if (!doc) throw new HttpError(404, "Record not found.");
  const name = await saveAvatar(req.file);
  await owner.model.updateOne({ _id: owner.id }, { $set: { avatar: name } });
  await removeAvatarFile(doc.avatar);
  await audit(req, "update", owner.kind === "me" ? "profile" : owner.kind, owner.id, "Changed profile picture");
  res.json({ success: true, data: { avatarUrl: avatarUrl(name) } });
}

export async function deleteAvatar(req, res) {
  const owner = ownerFor(req);
  const doc = await owner.model.findById(owner.id).lean();
  if (!doc) throw new HttpError(404, "Record not found.");
  await owner.model.updateOne({ _id: owner.id }, { $set: { avatar: "" } });
  await removeAvatarFile(doc.avatar);
  await audit(req, "update", owner.kind === "me" ? "profile" : owner.kind, owner.id, "Removed profile picture");
  res.json({ success: true, data: { avatarUrl: "" } });
}

/* Multer errors (too large, wrong field) become clear 400 responses. */
export function handleUpload(req, res, next) {
  avatarUpload(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "The image must be 2 MB or smaller." : "Upload one image in the avatar field.";
    next(new HttpError(400, message, "avatar"));
  });
}

/* Attendance totals for a profile page, by status, for the last 90 days. */
export async function attendanceSummary(personType, id) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rows = await Attendance.aggregate([
    { $match: { personType, person: new mongoose.Types.ObjectId(String(id)), date: { $gte: since } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}
