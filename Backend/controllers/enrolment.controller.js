import Course from "../DBModels/Course.js";
import Enrolment from "../DBModels/Enrolment.js";
import { getSettings } from "./public.controller.js";
import { priceFor } from "../services/pricing.js";
import { HOLD_MINUTES, closeUnpaid, newReference, releaseSeat, reserveSeat } from "../services/enrolment.service.js";
import { linkStudent } from "../services/people.service.js";
import { createCheckoutSession, simulatedPaymentsAllowed, stripeEnabled } from "../services/stripe.service.js";

const rules = {
  fullName: { re: /^[\p{L}][\p{L} .'-]{1,99}$/u, message: "Enter your full name." },
  email: { re: /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/, message: "Enter a valid email address." },
  phone: { re: /^\+?[0-9 ()-]{7,20}$/, message: "Enter a valid phone number." },
  country: { re: /^[\p{L} .'-]{2,60}$/u, message: "Enter your country." },
  identityNumber: { re: /^[A-Za-z0-9-]{5,30}$/, message: "Enter a valid CNIC or passport number." },
  education: { re: /^[\p{L}\p{N} .,'()&/-]{2,120}$/u, message: "Enter your highest qualification." },
};

function validateStudent(body) {
  const student = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = typeof body?.[field] === "string" ? body[field].trim() : "";
    if (!rule.re.test(value)) return { error: { field, message: rule.message } };
    student[field] = value;
  }
  return { student };
}

function publicStatus(enrolment, course) {
  return {
    reference: enrolment.reference,
    status: enrolment.status,
    courseCode: enrolment.courseCode,
    courseTitle: enrolment.courseTitle,
    courseSlug: course?.slug,
    batchId: enrolment.batchId,
    totalUsd: enrolment.totalUsdCents / 100,
    totalPkr: Math.round((enrolment.totalUsdCents / 100) * enrolment.pkrPerUsd),
    examIncludedByInstitute: enrolment.examIncludedByInstitute,
    holdExpiresAt: enrolment.holdExpiresAt,
    paymentProvider: enrolment.paymentProvider,
  };
}

export async function createEnrolment(req, res) {
  const { courseSlug, batchId, consent } = req.body || {};
  if (typeof courseSlug !== "string" || typeof batchId !== "string" || !/^[a-z0-9-]{2,40}$/.test(batchId)) {
    return res.status(400).json({ success: false, message: "Choose a course and a batch." });
  }
  if (consent !== true) {
    return res.status(400).json({ success: false, field: "consent", message: "Please accept the terms to continue." });
  }

  const { student, error } = validateStudent(req.body.student);
  if (error) return res.status(400).json({ success: false, field: error.field, message: error.message });

  if (!stripeEnabled() && !simulatedPaymentsAllowed()) {
    return res.status(503).json({ success: false, message: "Online enrollment is not available right now. Please contact admissions." });
  }

  const course = await Course.findOne({ slug: courseSlug.toLowerCase(), published: true });
  if (!course) return res.status(404).json({ success: false, message: "Course not found." });
  if (!course.batches.some((batch) => batch.id === batchId)) {
    return res.status(400).json({ success: false, message: "Choose a batch offered by this course." });
  }

  const reserved = await reserveSeat(course._id, batchId);
  if (!reserved) {
    return res.status(409).json({ success: false, message: "This batch is full. Please choose the other batch or contact admissions." });
  }

  const { pkrPerUsd } = await getSettings();
  const price = priceFor(course, pkrPerUsd);
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  let enrolment;
  try {
    enrolment = await Enrolment.create({
      reference: newReference(),
      course: course._id,
      courseCode: course.code,
      courseTitle: course.title,
      batchId,
      student,
      feeUsdCents: price.feeUsdCents,
      examFeeUsdCents: price.examFeeUsdCents,
      examIncludedByInstitute: course.examIncludedByInstitute,
      totalUsdCents: price.totalUsdCents,
      pkrPerUsd,
      holdExpiresAt,
      paymentProvider: stripeEnabled() ? "stripe" : "simulated",
    });
  } catch (err) {
    await releaseSeat(course._id, batchId);
    throw err;
  }

  if (!stripeEnabled()) {
    return res.status(201).json({ success: true, data: { ...publicStatus(enrolment, course), checkoutUrl: null } });
  }

  try {
    const session = await createCheckoutSession({ enrolment, course, price, holdExpiresAt });
    enrolment.stripeSessionId = session.id;
    await enrolment.save();
    return res.status(201).json({ success: true, data: { ...publicStatus(enrolment, course), checkoutUrl: session.url } });
  } catch (err) {
    await closeUnpaid({ _id: enrolment._id }, "cancelled");
    console.error("Stripe checkout could not be created:", err.message);
    return res.status(502).json({ success: false, message: "Payment could not be started. Your seat was not charged. Please try again." });
  }
}

export async function getEnrolment(req, res) {
  const reference = String(req.params.reference || "").toUpperCase();
  if (!/^PSCDB-[A-Z0-9]{10}$/.test(reference)) return res.status(404).json({ success: false, message: "Booking not found." });
  const enrolment = await Enrolment.findOne({ reference });
  if (!enrolment) return res.status(404).json({ success: false, message: "Booking not found." });
  const course = await Course.findById(enrolment.course, { slug: 1 }).lean();
  res.json({ success: true, data: publicStatus(enrolment, course) });
}

export async function cancelEnrolment(req, res) {
  const reference = String(req.params.reference || "").toUpperCase();
  const enrolment = await closeUnpaid({ reference }, "cancelled");
  if (!enrolment) return res.status(409).json({ success: false, message: "This booking cannot be cancelled." });
  res.json({ success: true, data: { reference, status: "cancelled" } });
}

/* Local testing only: completes a simulated payment. Disabled when Stripe is configured or in production. */
export async function simulatePayment(req, res) {
  if (!simulatedPaymentsAllowed()) return res.status(404).json({ success: false, message: "Not found." });
  const reference = String(req.params.reference || "").toUpperCase();
  const enrolment = await Enrolment.findOneAndUpdate(
    { reference, status: "pending_payment", paymentProvider: "simulated", holdExpiresAt: { $gt: new Date() } },
    { $set: { status: "paid", paidAt: new Date() } },
    { new: true },
  );
  if (!enrolment) return res.status(409).json({ success: false, message: "This booking cannot be paid. It may have expired." });
  await linkStudent(enrolment.toObject());
  res.json({ success: true, data: { reference, status: "paid" } });
}
