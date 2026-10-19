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
import Institute from "../DBModels/Institute.js";
import Certification from "../DBModels/Certification.js";
import SiteSection from "../DBModels/SiteSection.js";
import NavItem from "../DBModels/NavItem.js";
import Lab from "../DBModels/Lab.js";
import { logoUrl, removeLogoFile } from "./media.js";
import { nextCode } from "../DBModels/Counter.js";
import { HttpError, resource } from "../services/crud.js";
import { attendanceSummary, avatarUrl, removeAvatarFile } from "./profile.js";

const NAME = /^[\p{L}][\p{L} .'-]{1,99}$/u;
const ID_NUMBER = /^[A-Za-z0-9-]{5,30}$/;

async function requireShift(code) {
  if (code && !(await Shift.exists({ code }))) throw new HttpError(400, "Choose a valid shift.", "shift");
}
async function requireCentre(code, field = "centre") {
  if (code && !(await Centre.exists({ code }))) throw new HttpError(400, "Choose a valid center.", field);
}

async function requireLab(slug) {
  if (slug && !(await Lab.exists({ slug }))) throw new HttpError(400, "Choose a valid lab.", "lab");
}
const LINK = /^(\/[a-z0-9/_?=&#.-]*|https:\/\/[^\s]{3,})$/i;

/* ------------------------------------------------------------------ Students */
const students = resource({
  name: "students",
  model: Student,
  fields: {
    fullName: { type: "string", label: "Full name", required: true, max: 100, pattern: NAME, patternMessage: "Enter a valid full name.", properName: true },
    email: { type: "email", label: "Email", required: true },
    phone: { type: "phone", label: "Phone", required: true },
    country: { type: "string", label: "Country", max: 60, default: "Pakistan", properName: true },
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
    present: (doc) => ({ ...doc, avatarUrl: avatarUrl(doc.avatar) }),
    async beforeCreate(data) {
      return { ...data, studentId: await nextCode("student", "STU", 5), source: "desk" };
    },
    async beforeDelete(doc) {
      if (await Enrolment.exists({ studentRef: doc._id, status: { $in: ["paid", "pending_payment"] } })) {
        throw new HttpError(409, "This student has active enrollments. Set their status to withdrawn instead.");
      }
      await Attendance.deleteMany({ personType: "student", person: doc._id });
      await removeAvatarFile(doc.avatar);
    },
    async related(doc) {
      const [enrolments, attendance] = await Promise.all([
        Enrolment.find({ studentRef: doc._id }).sort({ createdAt: -1 }).limit(50).lean(),
        Attendance.find({ personType: "student", person: doc._id }).sort({ date: -1 }).limit(60).lean(),
      ]);
      return {
        attendanceSummary: await attendanceSummary("student", doc._id),
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
    fullName: { type: "string", label: "Full name", required: true, max: 100, pattern: NAME, patternMessage: "Enter a valid full name.", properName: true },
    email: { type: "email", label: "Email", required: true },
    phone: { type: "phone", label: "Phone" },
    identityNumber: { type: "string", label: "CNIC", max: 30, pattern: ID_NUMBER, patternMessage: "Enter a valid CNIC number." },
    role: { type: "enum", label: "Role", values: STAFF_ROLES, required: true },
    department: { type: "enum", label: "Department", values: ["ai", "cyber", "administration"], default: "administration" },
    shift: { type: "code", label: "Shift" },
    centre: { type: "code", label: "Center", default: "sahiwal" },
    status: { type: "enum", label: "Status", values: ["active", "on_leave", "inactive"], default: "active" },
    joinedOn: { type: "date", label: "Joined on" },
    notes: { type: "text", label: "Notes", max: 1000 },
  },
  search: ["staffId", "fullName", "email", "phone"],
  sortable: ["staffId", "fullName", "role", "status", "joinedOn", "createdAt"],
  filters: ["role", "department", "status", "shift", "centre"],
  describe: (doc) => `${doc.staffId} ${doc.fullName}`,
  hooks: {
    present: (doc) => ({ ...doc, avatarUrl: avatarUrl(doc.avatar) }),
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
      await removeAvatarFile(doc.avatar);
    },
    async related(doc) {
      const [attendance, account] = await Promise.all([
        Attendance.find({ personType: "staff", person: doc._id }).sort({ date: -1 }).limit(60).lean(),
        Admin.findOne({ email: doc.email }).lean(),
      ]);
      return {
        attendanceSummary: await attendanceSummary("staff", doc._id),
        account: account && { role: account.role, active: account.active !== false, lastLoginAt: account.lastLoginAt },
        attendance: attendance.map((a) => ({ id: String(a._id), date: a.date, status: a.status, checkInAt: a.checkInAt, checkOutAt: a.checkOutAt })) };
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
    city: { type: "string", label: "City", required: true, max: 60, properName: true },
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
        throw new HttpError(409, "This center is used by courses or staff, so its code cannot change.", "code");
      }
      return data;
    },
    async beforeDelete(doc) {
      if ((await Course.exists({ centre: doc.code })) || (await Staff.exists({ centre: doc.code }))) {
        throw new HttpError(409, `${doc.name} has courses or staff. Move them first, or mark the center inactive.`);
      }
    },
  },
});

/* ------------------------------------------------------------------ Courses */
const courseFields = {
  code: { type: "string", label: "Course code", required: true, max: 20, upper: true, pattern: /^[A-Za-z0-9-]{3,20}$/, patternMessage: "Use letters, numbers and hyphens, for example AI-102." },
  slug: { type: "string", label: "Web address", required: true, max: 120, pattern: /^[a-z0-9-]{3,120}$/, patternMessage: "Use lower-case letters, numbers and hyphens." },
  title: { type: "string", label: "Title", required: true, max: 160 },
  lab: { type: "code", label: "Lab", required: true },
  level: { type: "enum", label: "Level", values: ["Beginner", "Intermediate", "Advanced"], required: true },
  duration: { type: "string", label: "Duration", required: true, max: 40 },
  centre: { type: "code", label: "Center", required: true },
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
      await requireLab(data.lab);
      const capacity = Number.isInteger(req.body?.capacity) && req.body.capacity > 0 && req.body.capacity <= 1000 ? req.body.capacity : 50;
      const wanted = Array.isArray(req.body?.shifts) ? req.body.shifts : null;
      const list = await Shift.find(wanted ? { code: { $in: wanted } } : { active: true }).sort({ startTime: 1 }).lean();
      data.batches = list.map((shift) => ({ id: shift.code, label: `${shift.name} Batch`, timing: `${shift.startTime} to ${shift.endTime}`, capacity, seatsAvailable: capacity }));
      return data;
    },
    async beforeUpdate(data) {
      await requireCentre(data.centre);
      await requireLab(data.lab);
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
    name: { type: "string", label: "Name", required: true, max: 100, properName: true },
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
    name: { type: "string", label: "Name", required: true, max: 100, properName: true },
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
      const { passwordHash: _hash, failedLogins: _failed, lockedUntil: _locked, tokenVersion: _version, ...safe } = user;
      return { ...safe, avatarUrl: avatarUrl(user.avatar) };
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
      // Changing the password, role or access signs the user out everywhere.
      if (password || (rest.role && rest.role !== existing.role) || rest.active === false) {
        const { tokenVersion = 0 } = await Admin.findById(existing._id).select("+tokenVersion").lean();
        rest.tokenVersion = tokenVersion + 1;
      }
      return rest;
    },
    async related(doc) {
      const [staffRecord, activity] = await Promise.all([
        Staff.findOne({ email: doc.email }).lean(),
        AuditLog.find({ actor: doc.email }).sort({ createdAt: -1 }).limit(15).lean(),
      ]);
      return {
        staff: staffRecord && { id: String(staffRecord._id), staffId: staffRecord.staffId, role: staffRecord.role, department: staffRecord.department, shift: staffRecord.shift, status: staffRecord.status },
        activity: activity.map((a) => ({ id: String(a._id), action: a.action, resource: a.resource, summary: a.summary, createdAt: a.createdAt })),
      };
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

/* ------------------------------------------------------------------ Certification institutes */
const institutes = resource({
  name: "institutes",
  model: Institute,
  fields: {
    name: { type: "string", label: "Name", required: true, max: 100 },
    slug: { type: "code", label: "Web address", required: true },
    shortName: { type: "string", label: "Short name", max: 40 },
    website: { type: "url", label: "Official website" },
    description: { type: "text", label: "Description", max: 600 },
    logoSource: { type: "string", label: "Logo source", max: 500 },
    partnershipVerified: { type: "boolean", label: "Verified partner", default: false },
    partnershipNote: { type: "string", label: "Partnership note", max: 300 },
    showInStrip: { type: "boolean", label: "Show in homepage logos", default: true },
    showInNav: { type: "boolean", label: "Show in menu", default: true },
    order: { type: "number", label: "Order", integer: true, min: 0, max: 10000, default: 100 },
    active: { type: "boolean", label: "Active", default: true },
  },
  search: ["name", "slug", "shortName"],
  sortable: ["name", "order", "createdAt"],
  filters: ["active", "showInStrip", "showInNav"],
  defaultSort: "order",
  hooks: {
    present: (doc) => ({ ...doc, logoUrl: logoUrl(doc.logo) }),
    async beforeCreate(data) {
      checkPartnership(data, {});
      return data;
    },
    async beforeUpdate(data, existing) {
      checkPartnership(data, existing);
      return data;
    },
    async beforeDelete(doc) {
      if (await Certification.exists({ institute: doc._id })) throw new HttpError(409, `${doc.name} has certifications. Delete or move them first, or mark the institute inactive.`);
      await removeLogoFile(doc.logo);
    },
    async related(doc) {
      const certs = await Certification.find({ institute: doc._id }, { title: 1, code: 1, slug: 1 }).sort({ order: 1, title: 1 }).lean();
      return { certifications: certs.map((c) => ({ id: String(c._id), title: c.title, code: c.code, slug: c.slug })) };
    },
  },
});

/* A partner badge needs a written record of what was verified. */
function checkPartnership(data, existing) {
  const verified = data.partnershipVerified ?? existing.partnershipVerified;
  const note = data.partnershipNote ?? existing.partnershipNote;
  if (verified && !note) throw new HttpError(400, "Describe the verified partnership (for example the agreement and its date).", "partnershipNote");
}

/* ------------------------------------------------------------------ Certifications */
const certifications = resource({
  name: "certifications",
  model: Certification,
  fields: {
    institute: { type: "objectId", label: "Institute", required: true },
    title: { type: "string", label: "Title", required: true, max: 160 },
    code: { type: "string", label: "Exam code", max: 40 },
    slug: { type: "string", label: "Web address", required: true, max: 80, pattern: /^[a-z0-9-]{2,80}$/, patternMessage: "Use lower-case letters, numbers and hyphens." },
    category: { type: "enum", label: "Category", values: ["ai_ml", "cybersecurity"], required: true },
    level: { type: "string", label: "Level", max: 40 },
    description: { type: "text", label: "Description", max: 1000 },
    officialUrl: { type: "url", label: "Official page" },
    prerequisites: { type: "lines", label: "Prerequisites", maxItems: 20 },
    objectives: { type: "pairs", label: "Exam objectives", maxItems: 30 },
    examFormat: { type: "string", label: "Exam format", max: 200, db: "exam.format" },
    examQuestions: { type: "string", label: "Questions", max: 60, db: "exam.questions" },
    examDurationMinutes: { type: "number", label: "Exam length (minutes)", integer: true, min: 0, max: 2000, db: "exam.durationMinutes" },
    examPassingScore: { type: "string", label: "Passing score", max: 80, db: "exam.passingScore" },
    examLanguages: { type: "string", label: "Languages", max: 300, db: "exam.languages" },
    examDelivery: { type: "string", label: "Delivery", max: 200, db: "exam.delivery" },
    examFeeAmount: { type: "money", label: "Official exam fee", min: 0, max: 100000, db: "examFee.amountCents" },
    examFeeCurrency: { type: "string", label: "Exam fee currency", max: 3, upper: true, pattern: /^[A-Za-z]{3}$/, patternMessage: "Use a 3-letter currency code such as USD.", default: "USD", db: "examFee.currency" },
    examFeeRegion: { type: "string", label: "Price region", max: 120, db: "examFee.region" },
    examFeeSourceUrl: { type: "url", label: "Fee source", db: "examFee.sourceUrl" },
    examFeeVerifiedAt: { type: "date", label: "Fee verified on", db: "examFee.verifiedAt" },
    examFeeNotes: { type: "text", label: "Fee notes", max: 1000, db: "examFee.notes" },
    prepFeeUsd: { type: "money", label: "PSCDB preparation fee (USD)", min: 0, max: 100000, db: "prepFeeUsdCents" },
    prepIncludesExam: { type: "boolean", label: "Preparation fee includes the exam", default: false },
    prepDuration: { type: "string", label: "Training duration", max: 60 },
    labs: { type: "lines", label: "Practical labs", maxItems: 30 },
    curriculum: { type: "lines", label: "Preparation curriculum", maxItems: 30 },
    courses: { type: "refs", label: "Related courses", maxItems: 30 },
    featured: { type: "boolean", label: "Featured on homepage", default: false },
    order: { type: "number", label: "Order", integer: true, min: 0, max: 10000, default: 100 },
    active: { type: "boolean", label: "Active", default: true },
    sources: { type: "lines", label: "Sources", maxItems: 20, max: 500 },
    notes: { type: "text", label: "Internal notes", max: 1000 },
  },
  search: ["title", "code", "slug", "level"],
  sortable: ["title", "code", "order", "examFeeAmount", "prepFeeUsd", "createdAt"],
  filters: ["category", "institute", "featured", "active"],
  defaultSort: "order",
  describe: (doc) => `${doc.code ? `${doc.code} ` : ""}${doc.title}`,
  hooks: {
    async beforeCreate(data) {
      await checkCertificationLinks(data);
      return data;
    },
    async beforeUpdate(data) {
      await checkCertificationLinks(data);
      return data;
    },
  },
});
async function checkCertificationLinks(data) {
  if (data.institute && !(await Institute.exists({ _id: data.institute }))) throw new HttpError(400, "Choose a valid institute.", "institute");
  if (data.courses?.length && (await Course.countDocuments({ _id: { $in: data.courses } })) !== data.courses.length) {
    throw new HttpError(400, "Choose valid related courses.", "courses");
  }
}

/* ------------------------------------------------------------------ Website sections */
const sections = resource({
  name: "sections",
  model: SiteSection,
  fields: {
    eyebrow: { type: "string", label: "Eyebrow", max: 80 },
    title: { type: "string", label: "Title", max: 160 },
    subtitle: { type: "text", label: "Subtitle", max: 400 },
    body: { type: "text", label: "Body", max: 2000 },
    bullets: { type: "lines", label: "Points", maxItems: 12, max: 300 },
    ctaLabel: { type: "string", label: "Button label", max: 60 },
    ctaHref: { type: "string", label: "Button link", max: 200, pattern: LINK, patternMessage: "Use a page path such as /certifications or a full https:// address." },
    visible: { type: "boolean", label: "Visible", default: true },
    logoOpacity: { type: "number", label: "Logo opacity (%)", integer: true, min: 10, max: 100 },
    grayscale: { type: "boolean", label: "Grayscale logos" },
    logoHeight: { type: "number", label: "Logo height (px)", integer: true, min: 16, max: 80 },
    maxItems: { type: "number", label: "Items to show", integer: true, min: 1, max: 24 },
  },
  search: ["name", "title"],
  sortable: ["name"],
  filters: ["visible"],
  defaultSort: "name",
  roles: { create: "none", delete: "none" },
  describe: (doc) => doc.name,
});

/* ------------------------------------------------------------------ Navigation */
const navigation = resource({
  name: "navigation",
  model: NavItem,
  fields: {
    label: { type: "string", label: "Label", required: true, max: 40 },
    kind: { type: "enum", label: "Type", values: ["link", "certifications", "labs"], default: "link" },
    href: { type: "string", label: "Link", max: 200, pattern: LINK, patternMessage: "Use a page path such as /courses or a full https:// address." },
    parent: { type: "objectId", label: "Parent menu item" },
    order: { type: "number", label: "Order", integer: true, min: 0, max: 10000, default: 100 },
    visible: { type: "boolean", label: "Visible", default: true },
  },
  search: ["label", "href"],
  sortable: ["order", "label"],
  filters: ["kind", "visible"],
  defaultSort: "order",
  describe: (doc) => doc.label,
  hooks: {
    async beforeCreate(data) {
      await checkNav(data);
      return data;
    },
    async beforeUpdate(data, existing) {
      await checkNav({ ...existing, ...data }, existing._id);
      return data;
    },
    async beforeDelete(doc) {
      if (await NavItem.exists({ parent: doc._id })) throw new HttpError(409, `${doc.label} has sub-items. Move or delete them first.`);
    },
  },
});
async function checkNav(item, selfId) {
  if (item.kind === "link" && !item.href) throw new HttpError(400, "A link needs an address.", "href");
  if (!item.parent) return;
  if (selfId && String(item.parent) === String(selfId)) throw new HttpError(400, "An item cannot be its own parent.", "parent");
  const parent = await NavItem.findById(item.parent).lean();
  if (!parent) throw new HttpError(400, "Choose a valid parent menu item.", "parent");
  // Two levels at most: a top item and its sub-items.
  if (parent.parent) throw new HttpError(400, "Sub-items can only be added to top-level menu items.", "parent");
  if (parent.kind !== "link") throw new HttpError(400, "Certifications and Labs menus are filled automatically.", "parent");
}

/* ------------------------------------------------------------------ Labs */
const labs = resource({
  name: "labs",
  model: Lab,
  fields: {
    name: { type: "string", label: "Name", required: true, max: 80 },
    shortName: { type: "string", label: "Short name", required: true, max: 40 },
    slug: { type: "code", label: "Web address", required: true },
    category: { type: "enum", label: "Category", values: ["ai_ml", "cybersecurity"], required: true },
    headline: { type: "string", label: "Headline", max: 160 },
    intro: { type: "text", label: "Introduction", max: 1000 },
    pillars: { type: "pairs", label: "Core areas", maxItems: 8, valueKey: "text", valueMax: 300 },
    capabilities: { type: "lines", label: "What students practice", maxItems: 16 },
    order: { type: "number", label: "Order", integer: true, min: 0, max: 10000, default: 100 },
    visible: { type: "boolean", label: "Visible", default: true },
  },
  search: ["name", "slug"],
  sortable: ["order", "name"],
  filters: ["category", "visible"],
  defaultSort: "order",
  hooks: {
    async beforeUpdate(data, existing) {
      if (data.slug && data.slug !== existing.slug && (await Course.exists({ lab: existing.slug }))) {
        throw new HttpError(409, "Courses use this lab, so its web address cannot change.", "slug");
      }
      return data;
    },
    async beforeDelete(doc) {
      if (await Course.exists({ lab: doc.slug })) throw new HttpError(409, `${doc.name} has courses. Move them to another lab first, or hide the lab.`);
    },
  },
});

export const resources = { institutes, certifications, sections, navigation, labs, students, staff, shifts, centres, courses, enrolments, attendance, enquiries, users, audit: auditLog };
