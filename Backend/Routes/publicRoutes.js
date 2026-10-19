import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getCourse, listCourses, publicSettings } from "../controllers/public.controller.js";
import { cancelEnrolment, createEnrolment, getEnrolment, simulatePayment } from "../controllers/enrolment.controller.js";
import { createEnquiry } from "../controllers/enquiry.controller.js";

const router = Router();

const enrolLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many enrolment attempts. Please try again later." } });
const enquiryLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many messages. Please try again later." } });
const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false });

router.get("/courses", listCourses);
router.get("/courses/:slug", getCourse);
router.get("/settings", publicSettings);

router.post("/enrolments", enrolLimiter, createEnrolment);
router.post("/enquiries", enquiryLimiter, createEnquiry);
router.get("/enrolments/:reference", lookupLimiter, getEnrolment);
router.post("/enrolments/:reference/cancel", lookupLimiter, cancelEnrolment);
router.post("/enrolments/:reference/simulate-payment", lookupLimiter, simulatePayment);

export default router;
