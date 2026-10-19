import mongoose from "mongoose";

/* Main menu. "link" items point to a page; "certifications" and "labs" items fill their
   dropdowns automatically from institutes, certifications, labs and courses. */
const navItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 40 },
    kind: { type: String, enum: ["link", "certifications", "labs"], default: "link" },
    href: { type: String, trim: true, maxlength: 200, default: "" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "NavItem", default: null },
    order: { type: Number, default: 100 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("NavItem", navItemSchema);
