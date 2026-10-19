import mongoose from "mongoose";
import AuditLog from "../DBModels/AuditLog.js";
import { properName } from "./names.js";

/* Generic, validated CRUD for admin resources.
   Each resource declares its fields once; the same declaration drives input
   validation, searching, sorting and filtering, so no route accepts a field
   that was not listed. */

export class HttpError extends Error {
  constructor(status, message, field) {
    super(message);
    this.status = status;
    this.field = field;
    this.expose = true;
  }
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/* Converts one input value according to its field spec, or throws a 400 with the field name. */
function convert(name, spec, raw) {
  const label = spec.label || name;
  const empty = raw === undefined || raw === null || raw === "";
  if (empty) {
    if (spec.required) throw new HttpError(400, `${label} is required.`, name);
    if (spec.type === "boolean") return false;
    if (spec.type === "array") return [];
    if (["number", "money", "date"].includes(spec.type)) return null;
    return "";
  }

  switch (spec.type) {
    case "string":
    case "text":
    case "code": {
      if (typeof raw !== "string") throw new HttpError(400, `${label} must be text.`, name);
      let value = raw.trim();
      if (spec.type === "code") value = value.toLowerCase();
      const max = spec.max ?? (spec.type === "text" ? 2000 : 200);
      if (value.length > max) throw new HttpError(400, `${label} must be ${max} characters or fewer.`, name);
      if (spec.min && value.length < spec.min) throw new HttpError(400, `${label} must be at least ${spec.min} characters.`, name);
      if (spec.type === "code" && !/^[a-z0-9-]{2,40}$/.test(value)) throw new HttpError(400, `${label} may use lower-case letters, numbers and hyphens only.`, name);
      if (spec.pattern && !spec.pattern.test(value)) throw new HttpError(400, spec.patternMessage || `${label} is not valid.`, name);
      if (spec.upper) value = value.toUpperCase();
      if (spec.properName) value = properName(value);
      return value;
    }
    case "email": {
      const value = String(raw).trim().toLowerCase();
      if (!EMAIL.test(value)) throw new HttpError(400, "Enter a valid email address.", name);
      return value;
    }
    case "phone": {
      const value = String(raw).trim();
      if (!/^\+?[0-9 ()-]{7,20}$/.test(value)) throw new HttpError(400, "Enter a valid phone number.", name);
      return value;
    }
    case "enum": {
      if (!spec.values.includes(raw)) throw new HttpError(400, `Choose a valid ${label.toLowerCase()}.`, name);
      return raw;
    }
    case "array": {
      const list = Array.isArray(raw) ? raw : [raw];
      if (list.some((item) => !spec.values.includes(item))) throw new HttpError(400, `Choose valid ${label.toLowerCase()}.`, name);
      return [...new Set(list)];
    }
    case "number":
    case "money": {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) throw new HttpError(400, `${label} must be a number.`, name);
      if (spec.integer && !Number.isInteger(value)) throw new HttpError(400, `${label} must be a whole number.`, name);
      if (spec.min !== undefined && value < spec.min) throw new HttpError(400, `${label} must be at least ${spec.min}.`, name);
      if (spec.max !== undefined && value > spec.max) throw new HttpError(400, `${label} must be ${spec.max} or less.`, name);
      return spec.type === "money" ? Math.round(value * 100) : value;
    }
    case "boolean":
      return raw === true || raw === "true";
    case "date": {
      const value = new Date(raw);
      if (Number.isNaN(value.getTime())) throw new HttpError(400, `${label} must be a valid date.`, name);
      return value;
    }
    case "time": {
      if (!TIME.test(String(raw))) throw new HttpError(400, `${label} must be a time such as 09:30.`, name);
      return String(raw);
    }
    case "objectId": {
      if (!mongoose.isValidObjectId(raw)) throw new HttpError(400, `Choose a valid ${label.toLowerCase()}.`, name);
      return raw;
    }
    default:
      throw new HttpError(400, `${label} is not supported.`, name);
  }
}

/* Builds the database document from a request body. With partial, missing fields are left alone. */
export function parseBody(fields, body, { partial = false } = {}) {
  const data = {};
  const input = body && typeof body === "object" ? body : {};
  for (const [name, spec] of Object.entries(fields)) {
    if (spec.readonly) continue;
    const present = Object.prototype.hasOwnProperty.call(input, name);
    if (partial && !present) continue;
    if (!present && !spec.required && spec.default !== undefined) {
      data[spec.db || name] = spec.default;
      continue;
    }
    data[spec.db || name] = convert(name, spec, input[name]);
  }
  return data;
}

/* Converts a stored document for the API: money back to dollars, ids to strings. */
export function toApi(fields, doc) {
  if (!doc) return doc;
  const out = { ...doc, id: String(doc._id) };
  delete out._id;
  for (const [name, spec] of Object.entries(fields)) {
    if (spec.type === "money" && spec.db && doc[spec.db] !== undefined) {
      out[name] = doc[spec.db] === null ? null : doc[spec.db] / 100;
      delete out[spec.db];
    }
  }
  return out;
}

export async function audit(req, action, resource, recordId = "", summary = "") {
  try {
    await AuditLog.create({
      actor: req.admin?.email || "system",
      actorRole: req.admin?.role || "",
      action,
      resource,
      recordId: String(recordId || ""),
      summary: String(summary).slice(0, 300),
      ip: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

const ROLE_RANK = { staff: 1, manager: 2, superadmin: 3 };
export const canDo = (admin, role) => (ROLE_RANK[admin?.role] || 0) >= (ROLE_RANK[role] || 99);

/* Creates the handlers for one resource. */
export function resource(cfg) {
  const {
    name,
    model,
    fields,
    search = [],
    sortable = ["createdAt"],
    filters = [],
    dateField = "createdAt",
    defaultSort = "-createdAt",
    roles = {},
    describe = (doc) => doc.name || doc.fullName || doc.title || doc.code || "",
    hooks = {},
    readOnly = false,
  } = cfg;
  const allow = { read: "staff", create: "manager", update: "manager", delete: "manager", ...roles };
  const present = (doc) => (hooks.present ? hooks.present(toApi(fields, doc)) : toApi(fields, doc));

  const guard = (req, action) => {
    if (readOnly && action !== "read") throw new HttpError(405, "This list cannot be changed.");
    if (!canDo(req.admin, allow[action])) throw new HttpError(403, "You do not have permission to do this.");
  };

  const buildFilter = (query) => {
    const filter = {};
    const q = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
    if (q && search.length) {
      const re = new RegExp(escapeRegex(q), "i");
      filter.$or = search.map((field) => ({ [field]: re }));
    }
    for (const field of filters) {
      const value = query[field];
      if (typeof value !== "string" || value === "") continue;
      const spec = fields[field] || {};
      filter[spec.db || field] = spec.type === "boolean" ? value === "true" : value;
    }
    const range = {};
    if (typeof query.from === "string" && query.from) range.$gte = dateField === "date" ? query.from : new Date(query.from);
    if (typeof query.to === "string" && query.to) {
      range.$lte = dateField === "date" ? query.to : new Date(`${query.to}T23:59:59.999Z`);
    }
    if (Object.keys(range).length) filter[dateField] = range;
    return hooks.scope ? { ...filter, ...hooks.scope(query) } : filter;
  };

  return {
    name,
    allow,

    async list(req, res) {
      guard(req, "read");
      const filter = buildFilter(req.query);
      const exporting = req.query.export === "1";
      // Bulk exports of personal data are limited to managers and recorded.
      if (exporting && !canDo(req.admin, "manager")) throw new HttpError(403, "Only managers can export records.");
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), exporting ? 5000 : 100);
      const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
      const requested = typeof req.query.sort === "string" ? req.query.sort : defaultSort;
      const key = requested.replace(/^-/, "");
      const sortKey = sortable.includes(key) ? key : defaultSort.replace(/^-/, "");
      const direction = (sortable.includes(key) ? requested : defaultSort).startsWith("-") ? -1 : 1;
      const dbKey = fields[sortKey]?.db || sortKey;

      const [rows, total] = await Promise.all([
        model.find(filter).sort({ [dbKey]: direction, _id: direction }).skip((page - 1) * limit).limit(limit).lean(),
        model.countDocuments(filter),
      ]);
      if (exporting) await audit(req, "export", name, "", `Exported ${rows.length} rows`);
      res.json({ success: true, data: { rows: rows.map(present), total, page, limit } });
    },

    async get(req, res) {
      guard(req, "read");
      if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Record not found.");
      const doc = await model.findById(req.params.id).lean();
      if (!doc) throw new HttpError(404, "Record not found.");
      const extra = hooks.related ? await hooks.related(doc) : {};
      res.json({ success: true, data: { ...present(doc), ...extra } });
    },

    async create(req, res) {
      guard(req, "create");
      let data = parseBody(fields, req.body);
      if (hooks.beforeCreate) data = await hooks.beforeCreate(data, req);
      const doc = await model.create(data);
      if (hooks.afterCreate) await hooks.afterCreate(doc, req);
      await audit(req, "create", name, doc._id, describe(doc));
      res.status(201).json({ success: true, data: present(doc.toObject()) });
    },

    async update(req, res) {
      guard(req, "update");
      if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Record not found.");
      const existing = await model.findById(req.params.id).lean();
      if (!existing) throw new HttpError(404, "Record not found.");
      let data = parseBody(fields, req.body, { partial: true });
      if (hooks.beforeUpdate) data = await hooks.beforeUpdate(data, existing, req);
      const doc = await model.findByIdAndUpdate(existing._id, { $set: data }, { returnDocument: "after", runValidators: true }).lean();
      await audit(req, "update", name, doc._id, `${describe(doc)} (${Object.keys(data).join(", ") || "no changes"})`);
      res.json({ success: true, data: present(doc) });
    },

    async remove(req, res) {
      guard(req, "delete");
      if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "Record not found.");
      const doc = await model.findById(req.params.id).lean();
      if (!doc) throw new HttpError(404, "Record not found.");
      if (hooks.beforeDelete) await hooks.beforeDelete(doc, req);
      await model.deleteOne({ _id: doc._id });
      await audit(req, "delete", name, doc._id, describe(doc));
      res.json({ success: true });
    },

    async bulkRemove(req, res) {
      guard(req, "delete");
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => mongoose.isValidObjectId(id)).slice(0, 500) : [];
      if (!ids.length) throw new HttpError(400, "Select at least one record.");
      const docs = await model.find({ _id: { $in: ids } }).lean();
      const deleted = [];
      const skipped = [];
      for (const doc of docs) {
        try {
          if (hooks.beforeDelete) await hooks.beforeDelete(doc, req);
          await model.deleteOne({ _id: doc._id });
          await audit(req, "delete", name, doc._id, describe(doc));
          deleted.push(String(doc._id));
        } catch (err) {
          if (!(err instanceof HttpError)) throw err;
          skipped.push({ id: String(doc._id), label: describe(doc), reason: err.message });
        }
      }
      res.json({ success: true, data: { deleted: deleted.length, skipped } });
    },
  };
}
