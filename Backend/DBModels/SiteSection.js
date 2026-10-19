import mongoose from "mongoose";

/* Editable website text and display settings, one document per section. */
export const SECTION_KEYS = ["home_institutes", "home_featured_certifications", "certifications_page", "certification_disclaimer"];

const siteSectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, enum: SECTION_KEYS },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    eyebrow: { type: String, trim: true, maxlength: 80, default: "" },
    title: { type: String, trim: true, maxlength: 160, default: "" },
    subtitle: { type: String, trim: true, maxlength: 400, default: "" },
    body: { type: String, trim: true, maxlength: 2000, default: "" },
    bullets: { type: [String], default: [] },
    ctaLabel: { type: String, trim: true, maxlength: 60, default: "" },
    ctaHref: { type: String, trim: true, maxlength: 200, default: "" },
    visible: { type: Boolean, default: true },
    // Display settings for logo strips and card sections.
    logoOpacity: { type: Number, min: 10, max: 100, default: 55 },
    grayscale: { type: Boolean, default: true },
    logoHeight: { type: Number, min: 16, max: 80, default: 32 },
    maxItems: { type: Number, min: 1, max: 24, default: 6 },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("SiteSection", siteSectionSchema);
