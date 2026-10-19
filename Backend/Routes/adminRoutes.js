import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/adminAuth.js";
import { adminGetSettings, adminLogin, adminLogout, adminMe, adminUpdateSettings } from "../controllers/admin.controller.js";
import { resources } from "../admin/resources.js";
import { deleteInstituteLogo, handleLogoUpload, uploadInstituteLogo } from "../admin/media.js";
import { changeMyPassword, deleteAvatar, getMyProfile, handleUpload, serveAvatar, updateMyProfile, uploadAvatar } from "../admin/profile.js";
import {
  bulkDeleteEnrolments, checkIn, createManualEnrolment, dashboard, deleteEnrolment, lookupPeople, lookups, markAbsent, todayAttendance, updateCourseBatches, updateEnrolment,
} from "../admin/operations.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many attempts. Please try again later." } });

router.post("/login", loginLimiter, adminLogin);
router.post("/logout", adminLogout);

// Everything below needs a signed-in administrator.
router.use(requireAdmin());
router.get("/me", adminMe);
router.get("/dashboard", dashboard);
router.get("/lookups", lookups);
router.get("/settings", adminGetSettings);
router.put("/settings", requireAdmin("superadmin"), adminUpdateSettings);

// The signed-in user's own profile.
const passwordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many attempts. Please try again later." } });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many uploads. Please try again later." } });
router.get("/profile", getMyProfile);
router.patch("/profile", updateMyProfile);
router.post("/profile/password", passwordLimiter, changeMyPassword);
router.post("/profile/avatar", uploadLimiter, handleUpload, uploadAvatar);
router.delete("/profile/avatar", deleteAvatar);
router.get("/avatars/:name", serveAvatar);
router.post("/institutes/:id/logo", uploadLimiter, handleLogoUpload, uploadInstituteLogo);
router.delete("/institutes/:id/logo", deleteInstituteLogo);
router.post("/:kind/:id/avatar", uploadLimiter, handleUpload, uploadAvatar);
router.delete("/:kind/:id/avatar", deleteAvatar);

router.get("/checkin/lookup", lookupPeople);
router.get("/checkin/today", todayAttendance);
router.post("/checkin", checkIn);
router.post("/attendance/mark-absent", markAbsent);

router.post("/enrolments", createManualEnrolment);
router.patch("/enrolments/:id", updateEnrolment);
router.delete("/enrolments/:id", deleteEnrolment);
router.post("/enrolments/bulk-delete", bulkDeleteEnrolments);
router.put("/courses/:id/batches", updateCourseBatches);

// Generic list, view, create, update and delete for every resource.
const pick = (req) => {
  const item = Object.hasOwn(resources, req.params.resource) ? resources[req.params.resource] : null;
  if (!item) {
    const err = new Error("Not found.");
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};
router.get("/:resource", (req, res) => pick(req).list(req, res));
router.post("/:resource/bulk-delete", (req, res) => pick(req).bulkRemove(req, res));
router.get("/:resource/:id", (req, res) => pick(req).get(req, res));
router.post("/:resource", (req, res) => pick(req).create(req, res));
router.patch("/:resource/:id", (req, res) => pick(req).update(req, res));
router.delete("/:resource/:id", (req, res) => pick(req).remove(req, res));

export default router;
