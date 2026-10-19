import mongoose from "mongoose";

const enrolmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    batchId: { type: String, required: true, enum: ["morning", "evening"] },
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
      enum: ["pending_payment", "paid", "expired", "cancelled"],
      default: "pending_payment",
      index: true,
    },
    holdExpiresAt: { type: Date, required: true, index: true },
    paymentProvider: { type: String, enum: ["stripe", "simulated"], required: true },
    stripeSessionId: { type: String, index: true, sparse: true },
    paidAt: { type: Date },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Enrolment", enrolmentSchema);
