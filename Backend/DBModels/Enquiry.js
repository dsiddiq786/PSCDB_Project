import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    topic: { type: String, required: true, enum: ["admission", "programme", "payment", "research", "partnership", "opportunity", "other"] },
    courseSlug: { type: String, trim: true, maxlength: 120, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ["new", "answered"], default: "new", index: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Enquiry", enquirySchema);
