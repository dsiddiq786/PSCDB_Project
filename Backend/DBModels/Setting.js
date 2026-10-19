import mongoose from "mongoose";

/* Single settings document, edited by administrators. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    pkrPerUsd: { type: Number, required: true, min: 1, max: 100000 },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Setting", settingSchema);
