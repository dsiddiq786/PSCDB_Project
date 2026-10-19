import mongoose from "mongoose";

/* Who changed what in the admin panel. Entries are never edited. */
const auditSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true },
    actorRole: { type: String, default: "" },
    action: { type: String, required: true, enum: ["create", "update", "delete", "login", "check_in", "check_out", "settings", "export"] },
    resource: { type: String, required: true },
    recordId: { type: String, default: "" },
    summary: { type: String, maxlength: 300, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

auditSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditSchema);
