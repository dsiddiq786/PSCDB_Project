import mongoose from "mongoose";

const pillarSchema = new mongoose.Schema({ title: { type: String, required: true, maxlength: 80 }, text: { type: String, maxlength: 300, default: "" } }, { _id: false });

/* A teaching lab. Courses belong to a lab through Course.lab (the lab's slug). */
const labSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    shortName: { type: String, required: true, trim: true, maxlength: 40 },
    // The certification category this lab prepares for.
    category: { type: String, required: true, enum: ["ai_ml", "cybersecurity"] },
    headline: { type: String, trim: true, maxlength: 160, default: "" },
    intro: { type: String, trim: true, maxlength: 1000, default: "" },
    // Core areas: a title and a short description each.
    pillars: { type: [pillarSchema], default: [] },
    capabilities: { type: [String], default: [] },
    order: { type: Number, default: 100 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Lab", labSchema);
