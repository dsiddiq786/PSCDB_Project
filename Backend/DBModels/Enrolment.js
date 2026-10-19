import mongoose from "mongoose";

const enrolmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    batchId: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,40}$/ },
    // The student record created when the booking is paid.
    studentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Student", index: true },
    student: {
      fullName: { type: String, required: true, trim: true, maxlength: 100 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      country: { type: String, required: true, trim: true, maxlength: 60 },
      identityNumber: { type: String, required: true, trim: true, maxlength: 30 },
      education: { type: String, required: true, trim: true, maxlength: 120 },
    },
    // Amounts are fixed at the moment of enrolment.
    feeUsdCents: { type: Number, required: true, min: 0 },
    examFeeUsdCents: { type: Number, required: true, min: 0 },
    examIncludedByInstitute: { type: Boolean, required: true },
    totalUsdCents: { type: Number, required: true, min: 0 },
    pkrPerUsd: { type: Number, required: true },
    status: {
      type: String,
      // refund_due: paid after the hold ended while the batch was full; staff must refund or move it.
      enum: ["pending_payment", "paid", "expired", "cancelled", "refund_due"],
      default: "pending_payment",
      index: true,
    },
    holdExpiresAt: { type: Date, index: true },
    // "manual" covers bookings recorded by staff, paid in cash or by bank transfer.
    paymentProvider: { type: String, enum: ["stripe", "simulated", "manual"], required: true },
    paymentNote: { type: String, trim: true, maxlength: 300, default: "" },
    stripeSessionId: { type: String, index: true, sparse: true },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

// Supports the one-unpaid-booking-per-person check and the per-batch hold count.
enrolmentSchema.index({ status: 1, "student.email": 1 });
enrolmentSchema.index({ status: 1, "student.identityNumber": 1 });
enrolmentSchema.index({ course: 1, batchId: 1, status: 1 });

export default mongoose.model("Enrolment", enrolmentSchema);
