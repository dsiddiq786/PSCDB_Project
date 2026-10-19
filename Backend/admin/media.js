import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import multer from "multer";
import sharp from "sharp";
import Institute from "../DBModels/Institute.js";
import { HttpError, audit, canDo } from "../services/crud.js";

/* Institute logos: public images shown on the website. Uploads are decoded and re-encoded as
   transparent PNG (SVG is rasterized), so no script or metadata from the original file survives. */
export const LOGO_DIR = fileURLToPath(new URL("../uploads/logos/", import.meta.url));
const LOGO_NAME = /^[a-f0-9]{32}\.png$/;

export const logoUrl = (name) => (name && LOGO_NAME.test(name) ? `/api/v1/logos/${name}` : "");

export async function removeLogoFile(name) {
  if (name && LOGO_NAME.test(name)) await unlink(path.join(LOGO_DIR, name)).catch(() => {});
}

/* Converts an image buffer to a trimmed, transparent PNG no larger than 480 x 160. */
export async function saveLogo(buffer) {
  let output;
  try {
    const image = sharp(buffer, { limitInputPixels: 40_000_000, failOn: "error", density: 300 });
    const { format } = await image.metadata();
    if (!["jpeg", "png", "webp", "svg"].includes(format)) throw new Error("unsupported");
    output = await image.trim({ threshold: 4 }).resize(480, 160, { fit: "inside", withoutEnlargement: false }).png({ compressionLevel: 9 }).toBuffer();
  } catch {
    throw new HttpError(400, "Upload a PNG, JPG, WebP or SVG logo.", "logo");
  }
  await mkdir(LOGO_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.png`;
  await writeFile(path.join(LOGO_DIR, name), output, { flag: "wx" });
  return name;
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 } }).single("logo");
export function handleLogoUpload(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    next(new HttpError(400, err.code === "LIMIT_FILE_SIZE" ? "The logo must be 2 MB or smaller." : "Upload one image in the logo field.", "logo"));
  });
}

function manager(req) {
  if (!canDo(req.admin, "manager")) throw new HttpError(403, "You do not have permission to do this.");
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Record not found.");
}

export async function uploadInstituteLogo(req, res) {
  manager(req);
  const institute = await Institute.findById(req.params.id).lean();
  if (!institute) throw new HttpError(404, "Institute not found.");
  if (!req.file?.buffer?.length) throw new HttpError(400, "Choose a logo to upload.", "logo");
  const name = await saveLogo(req.file.buffer);
  await Institute.updateOne({ _id: institute._id }, { $set: { logo: name } });
  await removeLogoFile(institute.logo);
  await audit(req, "update", "institutes", institute._id, `${institute.name}: changed logo`);
  res.json({ success: true, data: { logoUrl: logoUrl(name) } });
}

export async function deleteInstituteLogo(req, res) {
  manager(req);
  const institute = await Institute.findById(req.params.id).lean();
  if (!institute) throw new HttpError(404, "Institute not found.");
  await Institute.updateOne({ _id: institute._id }, { $set: { logo: "" } });
  await removeLogoFile(institute.logo);
  await audit(req, "update", "institutes", institute._id, `${institute.name}: removed logo`);
  res.json({ success: true, data: { logoUrl: "" } });
}

/* Public: serves a logo file. */
export function serveLogo(req, res) {
  const name = String(req.params.name || "");
  if (!LOGO_NAME.test(name)) return res.status(404).json({ success: false, message: "Not found." });
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.sendFile(name, { root: LOGO_DIR, dotfiles: "deny" }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, message: "Not found." });
  });
}
