import mongoose from "mongoose";

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/* A teaching time slot. Course batches and staff are assigned to shifts. */
const shiftSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    days: { type: [{ type: String, enum: WEEKDAYS }], default: ["mon", "tue", "wed", "thu", "fri"] },
    // Minutes after the start time before a check-in counts as late.
    graceMinutes: { type: Number, min: 0, max: 180, default: 15 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Shift", shiftSchema);
