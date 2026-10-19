import mongoose from "mongoose";

/* An international certification provider, such as Microsoft or ISC2.
   PSCDB prepares students for their exams; it is not a partner unless partnershipVerified is set. */
const instituteSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,60}$/ },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    shortName: { type: String, trim: true, maxlength: 40, default: "" },
    website: { type: String, trim: true, maxlength: 500, default: "" },
    description: { type: String, trim: true, maxlength: 600, default: "" },
    // File name in uploads/logos, and where the logo came from.
    logo: { type: String, default: "" },
    logoSource: { type: String, trim: true, maxlength: 500, default: "" },
    // Only set after a partnership has been confirmed in writing.
    partnershipVerified: { type: Boolean, default: false },
    partnershipNote: { type: String, trim: true, maxlength: 300, default: "" },
    showInStrip: { type: Boolean, default: true },
    showInNav: { type: Boolean, default: true },
    order: { type: Number, default: 100 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Institute", instituteSchema);
