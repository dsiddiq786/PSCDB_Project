import mongoose from "mongoose";

/* Sequence numbers for human-readable IDs such as STU-00001. */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
const Counter = mongoose.model("Counter", counterSchema);

export async function nextCode(name, prefix, width) {
  const { seq } = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { returnDocument: "after", upsert: true });
  return `${prefix}-${String(seq).padStart(width, "0")}`;
}

export default Counter;
