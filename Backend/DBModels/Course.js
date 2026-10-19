import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    // The code of the shift this batch runs in, for example "morning".
    id: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,40}$/ },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    timing: { type: String, trim: true, maxlength: 80, default: "" },
    capacity: { type: Number, required: true, min: 0, max: 1000 },
    // Seats are reserved by decrementing this counter atomically.
    seatsAvailable: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 20 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    lab: { type: String, required: true, enum: ["ai", "cyber"] },
    level: { type: String, required: true, enum: ["Beginner", "Intermediate", "Advanced"] },
    duration: { type: String, required: true, trim: true, maxlength: 40 },
    // Used on the public site for courses added in the admin panel.
    summary: { type: String, trim: true, maxlength: 600, default: "" },
    centre: { type: String, required: true, default: "sahiwal" },
    // Money is stored in whole US cents to avoid rounding errors.
    feeUsdCents: { type: Number, required: true, min: 0 },
    examFeeUsdCents: { type: Number, required: true, min: 0 },
    examIncludedByInstitute: { type: Boolean, default: false },
    batches: { type: [batchSchema], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Course", courseSchema);
