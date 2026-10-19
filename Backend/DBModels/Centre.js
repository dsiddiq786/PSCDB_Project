import mongoose from "mongoose";

const centreSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,40}$/ },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    address: { type: String, trim: true, maxlength: 200, default: "" },
    phone: { type: String, trim: true, maxlength: 20, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, strict: "throw" },
);

export default mongoose.model("Centre", centreSchema);
