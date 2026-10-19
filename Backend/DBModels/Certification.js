import mongoose from "mongoose";

const objectiveSchema = new mongoose.Schema({ title: { type: String, required: true, maxlength: 200 }, weight: { type: String, maxlength: 40, default: "" } }, { _id: false });

/* An international certification. Three prices are kept apart:
   PSCDB course tuition lives on Course; the provider's official exam fee and PSCDB's own
   certification-preparation fee live here and are managed independently. */
const certificationSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,80}$/ },
    code: { type: String, trim: true, maxlength: 40, default: "" },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, enum: ["ai_ml", "cybersecurity"], index: true },
    level: { type: String, trim: true, maxlength: 40, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    officialUrl: { type: String, trim: true, maxlength: 500, default: "" },
    prerequisites: { type: [String], default: [] },
    objectives: { type: [objectiveSchema], default: [] },
    exam: {
      format: { type: String, trim: true, maxlength: 200, default: "" },
      questions: { type: String, trim: true, maxlength: 60, default: "" },
      durationMinutes: { type: Number, min: 0, max: 2000, default: null },
      passingScore: { type: String, trim: true, maxlength: 80, default: "" },
      languages: { type: String, trim: true, maxlength: 300, default: "" },
      delivery: { type: String, trim: true, maxlength: 200, default: "" },
    },
    // The fee published by the provider, exactly as published.
    examFee: {
      amountCents: { type: Number, min: 0, default: null },
      currency: { type: String, trim: true, uppercase: true, match: /^[A-Z]{3}$/, default: "USD" },
      region: { type: String, trim: true, maxlength: 120, default: "" },
      sourceUrl: { type: String, trim: true, maxlength: 500, default: "" },
      verifiedAt: { type: Date, default: null },
      notes: { type: String, trim: true, maxlength: 1000, default: "" },
    },
    // PSCDB's fee for hands-on preparation, charged in US dollars.
    prepFeeUsdCents: { type: Number, min: 0, default: null },
    prepIncludesExam: { type: Boolean, default: false },
    prepDuration: { type: String, trim: true, maxlength: 60, default: "" },
    labs: { type: [String], default: [] },
    curriculum: { type: [String], default: [] },
    courses: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], default: [] },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 100 },
    active: { type: Boolean, default: true },
    sources: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Certification", certificationSchema);
