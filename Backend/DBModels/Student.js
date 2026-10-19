import mongoose from "mongoose";

/* One record per person. Online bookings create or update it when payment succeeds. */
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 60, default: "Pakistan" },
    identityNumber: { type: String, trim: true, maxlength: 30, default: "" },
    education: { type: String, trim: true, maxlength: 120, default: "" },
    status: { type: String, enum: ["active", "suspended", "graduated", "withdrawn"], default: "active", index: true },
    source: { type: String, enum: ["online", "desk"], default: "desk" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    // File name of the profile picture in uploads/avatars.
    avatar: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Student", studentSchema);
