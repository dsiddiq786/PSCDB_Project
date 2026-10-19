import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    passwordHash: { type: String, required: true, select: false },
    // superadmin: everything. manager: all records but not users or settings. staff: front desk.
    role: { type: String, enum: ["superadmin", "manager", "staff"], default: "staff" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    jobTitle: { type: String, trim: true, maxlength: 80, default: "" },
    // File name of the profile picture in uploads/avatars.
    avatar: { type: String, default: "" },
    // Raised whenever the password, role or access changes, which signs out every existing session.
    tokenVersion: { type: Number, default: 0, select: false },
    failedLogins: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Admin", adminSchema);
