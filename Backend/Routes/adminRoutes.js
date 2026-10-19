import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  adminGetSettings, adminListCourses, adminListEnrolments, adminLogin, adminLogout, adminMe, adminOverview, adminUpdateCourse, adminUpdateSettings,
} from "../controllers/admin.controller.js";
import { adminListEnquiries, adminUpdateEnquiry } from "../controllers/enquiry.controller.js";

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many attempts. Please try again later." } });

router.post("/login", loginLimiter, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", requireAdmin(), adminMe);
router.get("/overview", requireAdmin(), adminOverview);
router.get("/enrolments", requireAdmin(), adminListEnrolments);
router.get("/courses", requireAdmin(), adminListCourses);
router.patch("/courses/:code", requireAdmin("superadmin"), adminUpdateCourse);
router.get("/enquiries", requireAdmin(), adminListEnquiries);
router.patch("/enquiries/:id", requireAdmin(), adminUpdateEnquiry);
router.get("/settings", requireAdmin(), adminGetSettings);
router.put("/settings", requireAdmin("superadmin"), adminUpdateSettings);

export default router;
