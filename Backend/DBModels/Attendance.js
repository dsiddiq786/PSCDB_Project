import mongoose from "mongoose";

/* One record per person per day: check-in, check-out and the resulting status. */
const attendanceSchema = new mongoose.Schema(
  {
    personType: { type: String, required: true, enum: ["student", "staff"] },
    person: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "personModel" },
    personModel: { type: String, required: true, enum: ["Student", "Staff"] },
    personCode: { type: String, required: true },
    personName: { type: String, required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    shift: { type: String, default: "" },
    courseCode: { type: String, default: "" },
    status: { type: String, enum: ["present", "late", "absent", "leave"], default: "present", index: true },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    recordedBy: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

attendanceSchema.index({ personType: 1, person: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });

export default mongoose.model("Attendance", attendanceSchema);
