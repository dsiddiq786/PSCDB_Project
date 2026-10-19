import mongoose from "mongoose";

export const STAFF_ROLES = ["instructor", "lab_engineer", "admissions", "accounts", "management", "support"];

const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    identityNumber: { type: String, trim: true, maxlength: 30, default: "" },
    role: { type: String, required: true, enum: STAFF_ROLES },
    department: { type: String, enum: ["ai", "cyber", "administration"], default: "administration" },
    shift: { type: String, trim: true, lowercase: true, default: "" },
    centre: { type: String, trim: true, lowercase: true, default: "sahiwal" },
    status: { type: String, enum: ["active", "on_leave", "inactive"], default: "active", index: true },
    joinedOn: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    // File name of the profile picture in uploads/avatars.
    avatar: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Staff", staffSchema);
