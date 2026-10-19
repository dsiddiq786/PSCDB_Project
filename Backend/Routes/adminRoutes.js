import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/adminAuth.js";
import { adminGetSettings, adminLogin, adminLogout, adminMe, adminUpdateSettings } from "../controllers/admin.controller.js";
import { resources } from "../admin/resources.js";
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
