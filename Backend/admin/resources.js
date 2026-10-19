import argon2 from "argon2";
import Admin from "../DBModels/Admin.js";
import Attendance from "../DBModels/Attendance.js";
import AuditLog from "../DBModels/AuditLog.js";
import Centre from "../DBModels/Centre.js";
import Course from "../DBModels/Course.js";
import Enquiry from "../DBModels/Enquiry.js";
import Enrolment from "../DBModels/Enrolment.js";
import Shift, { WEEKDAYS } from "../DBModels/Shift.js";
import Staff, { STAFF_ROLES } from "../DBModels/Staff.js";
import Student from "../DBModels/Student.js";
import { nextCode } from "../DBModels/Counter.js";
import { HttpError, resource } from "../services/crud.js";

const NAME = /^[\p{L}][\p{L} .'-]{1,99}$/u;
const ID_NUMBER = /^[A-Za-z0-9-]{5,30}$/;

async function requireShift(code) {
  if (code && !(await Shift.exists({ code }))) throw new HttpError(400, "Choose a valid shift.", "shift");
}
async function requireCentre(code, field = "centre") {
  if (code && !(await Centre.exists({ code }))) throw new HttpError(400, "Choose a valid centre.", field);
}

/* ------------------------------------------------------------------ Students */
const students = resource({
  name: "students",
  model: Student,
  fields: {
    fullName: { type: "string", label: "Full name", required: true, max: 100, pattern: NAME, patternMessage: "Enter a valid full name." },
    email: { type: "email", label: "Email", required: true },
    phone: { type: "phone", label: "Phone", required: true },
    country: { type: "string", label: "Country", max: 60, default: "Pakistan" },
    identityNumber: { type: "string", label: "CNIC or passport", max: 30, pattern: ID_NUMBER, patternMessage: "Enter a valid CNIC or passport number." },
    education: { type: "string", label: "Education", max: 120 },
    status: { type: "enum", label: "Status", values: ["active", "suspended", "graduated", "withdrawn"], default: "active" },
    notes: { type: "text", label: "Notes", max: 1000 },
  },
  search: ["studentId", "fullName", "email", "phone", "identityNumber"],
  sortable: ["studentId", "fullName", "email", "status", "createdAt"],
  filters: ["status", "source"],
  roles: { create: "staff", update: "staff" },
  describe: (doc) => `${doc.studentId} ${doc.fullName}`,
  hooks: {
    async beforeCreate(data) {
      return { ...data, studentId: await nextCode("student", "STU", 5), source: "desk" };
    },
    async beforeDelete(doc) {
      if (await Enrolment.exists({ studentRef: doc._id, status: { $in: ["paid", "pending_payment"] } })) {
        throw new HttpError(409, "This student has active enrollments. Set their status to withdrawn instead.");
      }
      await Attendance.deleteMany({ personType: "student", person: doc._id });
    },
    async related(doc) {
      const [enrolments, attendance] = await Promise.all([
        Enrolment.find({ studentRef: doc._id }).sort({ createdAt: -1 }).limit(50).lean(),
        Attendance.find({ personType: "student", person: doc._id }).sort({ date: -1 }).limit(60).lean(),
      ]);
      return {
        enrolments: enrolments.map((e) => ({ id: String(e._id), reference: e.reference, courseCode: e.courseCode, courseTitle: e.courseTitle, batchId: e.batchId, status: e.status, totalUsd: e.totalUsdCents / 100, createdAt: e.createdAt })),
        attendance: attendance.map((a) => ({ id: String(a._id), date: a.date, status: a.status, checkInAt: a.checkInAt, checkOutAt: a.checkOutAt })),
      };
    },
  },
});

/* ------------------------------------------------------------------ Staff */
const staff = resource({
  name: "staff",
  model: Staff,
  fields: {
    fullName: { type: "string", label: "Full name", required: true, max: 100, pattern: NAME, patternMessage: "Enter a valid full name." },
    email: { type: "email", label: "Email", required: true },
    phone: { type: "phone", label: "Phone" },
    identityNumber: { type: "string", label: "CNIC", max: 30, pattern: ID_NUMBER, patternMessage: "Enter a valid CNIC number." },
    role: { type: "enum", label: "Role", values: STAFF_ROLES, required: true },
    department: { type: "enum", label: "Department", values: ["ai", "cyber", "administration"], default: "administration" },
    shift: { type: "code", label: "Shift" },
    centre: { type: "code", label: "Centre", default: "sahiwal" },
    status: { type: "enum", label: "Status", values: ["active", "on_leave", "inactive"], default: "active" },
    joinedOn: { type: "date", label: "Joined on" },
    notes: { type: "text", label: "Notes", max: 1000 },
  },
  search: ["staffId", "fullName", "email", "phone"],
  sortable: ["staffId", "fullName", "role", "status", "joinedOn", "createdAt"],
  filters: ["role", "department", "status", "shift", "centre"],
  describe: (doc) => `${doc.staffId} ${doc.fullName}`,
  hooks: {
    async beforeCreate(data) {
      await requireShift(data.shift);
      await requireCentre(data.centre);
      return { ...data, staffId: await nextCode("staff", "STF", 4) };
    },
    async beforeUpdate(data) {
      await requireShift(data.shift);
      await requireCentre(data.centre);
      return data;
    },
    async beforeDelete(doc) {
      await Attendance.deleteMany({ personType: "staff", person: doc._id });
    },
    async related(doc) {
      const attendance = await Attendance.find({ personType: "staff", person: doc._id }).sort({ date: -1 }).limit(60).lean();
      return { attendance: attendance.map((a) => ({ id: String(a._id), date: a.date, status: a.status, checkInAt: a.checkInAt, checkOutAt: a.checkOutAt })) };
    },
  },
});

/* ------------------------------------------------------------------ Shifts */
const shifts = resource({
  name: "shifts",
  model: Shift,
  fields: {
    code: { type: "code", label: "Code", required: true },
    name: { type: "string", label: "Name", required: true, max: 60 },
    startTime: { type: "time", label: "Start time", required: true },
    endTime: { type: "time", label: "End time", required: true },
    days: { type: "array", label: "Days", values: WEEKDAYS, default: ["mon", "tue", "wed", "thu", "fri"] },
    graceMinutes: { type: "number", label: "Late after (minutes)", integer: true, min: 0, max: 180, default: 15 },
    active: { type: "boolean", label: "Active", default: true },
  },
  search: ["code", "name"],
  sortable: ["code", "name", "startTime", "createdAt"],
  filters: ["active"],
  defaultSort: "startTime",
  hooks: {
    async beforeCreate(data) {
      if (data.startTime === data.endTime) throw new HttpError(400, "The end time must differ from the start time.", "endTime");
      return data;
    },
    async beforeUpdate(data, existing) {
      if (data.code && data.code !== existing.code && (await shiftInUse(existing.code))) {
        throw new HttpError(409, "This shift is used by courses or staff, so its code cannot change.", "code");
      }
      return data;
    },
    async beforeDelete(doc) {
      if (await shiftInUse(doc.code)) throw new HttpError(409, `${doc.name} is used by course batches or staff. Remove it from them first, or mark it inactive.`);
    },
    async related(doc) {
      const [courses, staffCount] = await Promise.all([Course.find({ "batches.id": doc.code }, { code: 1, title: 1 }).lean(), Staff.countDocuments({ shift: doc.code })]);
      return { courses: courses.map((c) => ({ code: c.code, title: c.title })), staffCount };
    },
  },
});
async function shiftInUse(code) {
  return Boolean((await Course.exists({ "batches.id": code })) || (await Staff.exists({ shift: code })));
}

/* ------------------------------------------------------------------ Centres */
const centres = resource({
  name: "centres",
  model: Centre,
  fields: {
    code: { type: "code", label: "Code", required: true },
    name: { type: "string", label: "Name", required: true, max: 100 },
    city: { type: "string", label: "City", required: true, max: 60 },
    address: { type: "string", label: "Address", max: 200 },
    phone: { type: "phone", label: "Phone" },
    active: { type: "boolean", label: "Active", default: true },
  },
  search: ["code", "name", "city"],
  sortable: ["code", "name", "city", "createdAt"],
  filters: ["active"],
  defaultSort: "name",
  hooks: {
    async beforeUpdate(data, existing) {
      if (data.code && data.code !== existing.code && ((await Course.exists({ centre: existing.code })) || (await Staff.exists({ centre: existing.code })))) {
        throw new HttpError(409, "This centre is used by courses or staff, so its code cannot change.", "code");
      }
      return data;
    },
    async beforeDelete(doc) {
      if ((await Course.exists({ centre: doc.code })) || (await Staff.exists({ centre: doc.code }))) {
        throw new HttpError(409, `${doc.name} has courses or staff. Move them first, or mark the centre inactive.`);
      }
    },
  },
});

/* ------------------------------------------------------------------ Courses */
const courseFields = {
  code: { type: "string", label: "Course code", required: true, max: 20, upper: true, pattern: /^[A-Za-z0-9-]{3,20}$/, patternMessage: "Use letters, numbers and hyphens, for example AI-102." },
  slug: { type: "string", label: "Web address", required: true, max: 120, pattern: /^[a-z0-9-]{3,120}$/, patternMessage: "Use lower-case letters, numbers and hyphens." },
  title: { type: "string", label: "Title", required: true, max: 160 },
  lab: { type: "enum", label: "Lab", values: ["ai", "cyber"], required: true },
  level: { type: "enum", label: "Level", values: ["Beginner", "Intermediate", "Advanced"], required: true },
  duration: { type: "string", label: "Duration", required: true, max: 40 },
  centre: { type: "code", label: "Centre", required: true },
  feeUsd: { type: "money", db: "feeUsdCents", label: "Course fee", required: true, min: 0, max: 100000 },
  examFeeUsd: { type: "money", db: "examFeeUsdCents", label: "Exam fee", required: true, min: 0, max: 100000 },
  examIncludedByInstitute: { type: "boolean", label: "Institute pays the exam fee", default: false },
  summary: { type: "text", label: "Summary", max: 600 },
  published: { type: "boolean", label: "Published", default: true },
};

const courses = resource({
  name: "courses",
  model: Course,
  fields: courseFields,
  search: ["code", "title", "slug"],
  sortable: ["code", "title", "level", "feeUsd", "createdAt"],
  filters: ["lab", "level", "published", "centre"],
  defaultSort: "code",
  describe: (doc) => `${doc.code} ${doc.title}`,
  hooks: {
    present(course) {
      const capacity = (course.batches || []).reduce((sum, b) => sum + b.capacity, 0);
      const free = (course.batches || []).reduce((sum, b) => sum + b.seatsAvailable, 0);
      return { ...course, capacity, booked: capacity - free };
    },
    async beforeCreate(data, req) {
      await requireCentre(data.centre);
      const capacity = Number.isInteger(req.body?.capacity) && req.body.capacity > 0 && req.body.capacity <= 1000 ? req.body.capacity : 50;
      const wanted = Array.isArray(req.body?.shifts) ? req.body.shifts : null;
      const list = await Shift.find(wanted ? { code: { $in: wanted } } : { active: true }).sort({ startTime: 1 }).lean();
      data.batches = list.map((shift) => ({ id: shift.code, label: `${shift.name} batch`, timing: `${shift.startTime} to ${shift.endTime}`, capacity, seatsAvailable: capacity }));
      return data;
    },
    async beforeUpdate(data) {
      await requireCentre(data.centre);
      return data;
    },
    async beforeDelete(doc) {
      if (await Enrolment.exists({ course: doc._id })) throw new HttpError(409, `${doc.code} has enrollments, so it cannot be deleted. Unpublish it instead.`);
    },
  },
});

/* ------------------------------------------------------------------ Enrolments (writes are custom) */
const enrolments = resource({
  name: "enrolments",
  model: Enrolment,
  fields: {
    totalUsd: { type: "money", db: "totalUsdCents", label: "Total", readonly: true },
    feeUsd: { type: "money", db: "feeUsdCents", label: "Course fee", readonly: true },
    examFeeUsd: { type: "money", db: "examFeeUsdCents", label: "Exam fee", readonly: true },
  },
  search: ["reference", "student.fullName", "student.email", "student.phone", "courseCode", "courseTitle"],
  sortable: ["createdAt", "reference", "totalUsd", "status", "paidAt", "courseCode"],
  filters: ["status", "batchId", "courseCode", "paymentProvider"],
  describe: (doc) => `${doc.reference} ${doc.student?.fullName || ""}`,
});

/* ------------------------------------------------------------------ Attendance */
const attendance = resource({
  name: "attendance",
  model: Attendance,
  fields: {
    status: { type: "enum", label: "Status", values: ["present", "late", "absent", "leave"], required: true },
    checkInAt: { type: "date", label: "Check-in time" },
    checkOutAt: { type: "date", label: "Check-out time" },
    note: { type: "string", label: "Note", max: 300 },
  },
  search: ["personName", "personCode", "courseCode"],
  sortable: ["date", "personName", "status", "checkInAt", "checkOutAt"],
  filters: ["personType", "status", "shift", "date"],
  dateField: "date",
  defaultSort: "-date",
  roles: { update: "staff", delete: "manager" },
  describe: (doc) => `${doc.personCode} ${doc.date}`,
  hooks: {
    async beforeUpdate(data, existing) {
      const checkIn = data.checkInAt ?? existing.checkInAt;
      const checkOut = data.checkOutAt ?? existing.checkOutAt;
      if (checkIn && checkOut && checkOut < checkIn) throw new HttpError(400, "Check-out must be after check-in.", "checkOutAt");
      return data;
    },
  },
});

/* ------------------------------------------------------------------ Enquiries */
const enquiries = resource({
  name: "enquiries",
  model: Enquiry,
  fields: {
    name: { type: "string", label: "Name", required: true, max: 100 },
    email: { type: "email", label: "Email", required: true },
    phone: { type: "phone", label: "Phone" },
    topic: { type: "enum", label: "Topic", values: ["admission", "programme", "payment", "research", "partnership", "opportunity", "other"], required: true },
    message: { type: "text", label: "Message", required: true, max: 3000 },
    status: { type: "enum", label: "Status", values: ["new", "answered"], default: "new" },
  },
  search: ["name", "email", "phone", "message"],
  sortable: ["createdAt", "name", "topic", "status"],
  filters: ["status", "topic"],
  roles: { create: "staff", update: "staff" },
});

/* ------------------------------------------------------------------ Admin users */
const hashPassword = (password) => argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

async function guardLastSuperadmin(existing, next) {
  const losing = existing.role === "superadmin" && (next.role !== "superadmin" || next.active === false);
  if (losing && (await Admin.countDocuments({ role: "superadmin", active: { $ne: false } })) <= 1) {
    throw new HttpError(409, "There must always be at least one active superadmin.");
  }
}

const users = resource({
  name: "users",
  model: Admin,
  fields: {
    name: { type: "string", label: "Name", required: true, max: 100 },
    email: { type: "email", label: "Email", required: true },
    role: { type: "enum", label: "Role", values: ["superadmin", "manager", "staff"], required: true },
    active: { type: "boolean", label: "Active", default: true },
    password: { type: "string", label: "Password", min: 12, max: 200 },
  },
  search: ["name", "email"],
  sortable: ["name", "email", "role", "lastLoginAt", "createdAt"],
  filters: ["role", "active"],
  roles: { read: "superadmin", create: "superadmin", update: "superadmin", delete: "superadmin" },
  describe: (doc) => doc.email,
  hooks: {
    present(user) {
      const { passwordHash: _hash, failedLogins: _failed, lockedUntil: _locked, ...safe } = user;
      return safe;
    },
    async beforeCreate(data) {
      if (!data.password) throw new HttpError(400, "Set a password of at least 12 characters.", "password");
      const { password, ...rest } = data;
      return { ...rest, passwordHash: await hashPassword(password) };
    },
    async beforeUpdate(data, existing, req) {
      if (String(existing._id) === String(req.admin._id) && (data.role && data.role !== existing.role || data.active === false)) {
        throw new HttpError(409, "You cannot change your own role or deactivate your own account.");
      }
      await guardLastSuperadmin(existing, { role: data.role ?? existing.role, active: data.active ?? existing.active });
      const { password, ...rest } = data;
      if (password) Object.assign(rest, { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null });
      return rest;
    },
    async beforeDelete(doc, req) {
      if (String(doc._id) === String(req.admin._id)) throw new HttpError(409, "You cannot delete your own account.");
      await guardLastSuperadmin(doc, { role: "none", active: false });
    },
  },
});

/* ------------------------------------------------------------------ Audit log */
const auditLog = resource({
  name: "audit",
  model: AuditLog,
  fields: {},
  search: ["actor", "resource", "summary", "recordId"],
  sortable: ["createdAt", "actor", "action", "resource"],
  filters: ["action", "resource"],
  roles: { read: "superadmin" },
  readOnly: true,
});

export const resources = { students, staff, shifts, centres, courses, enrolments, attendance, enquiries, users, audit: auditLog };
