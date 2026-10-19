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
    failedLogins: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Admin", adminSchema);
