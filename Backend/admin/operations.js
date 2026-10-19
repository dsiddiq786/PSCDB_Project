import mongoose from "mongoose";
import Attendance from "../DBModels/Attendance.js";
import Centre from "../DBModels/Centre.js";
import Institute from "../DBModels/Institute.js";
import Lab from "../DBModels/Lab.js";
import NavItem from "../DBModels/NavItem.js";
import Course from "../DBModels/Course.js";
import Enquiry from "../DBModels/Enquiry.js";
import Enrolment from "../DBModels/Enrolment.js";
import Shift from "../DBModels/Shift.js";
import Staff from "../DBModels/Staff.js";
import Student from "../DBModels/Student.js";
import { HttpError, audit, canDo } from "../services/crud.js";
import { getSettings } from "../controllers/public.controller.js";
import { priceFor } from "../services/pricing.js";
import { newReference, releaseSeat } from "../services/enrolment.service.js";
import { addMinutes, linkStudent, localNow } from "../services/people.service.js";

const HOLDS_SEAT = ["pending_payment", "paid"];
const needRole = (req, role) => {
  if (!canDo(req.admin, role)) throw new HttpError(403, "You do not have permission to do this.");
};
const objectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) throw new HttpError(400, `Choose a valid ${label}.`, label);
  return value;
};

/* ------------------------------------------------------------------ Enrolments */

/* Records a booking taken at the desk, for example paid in cash or by bank transfer. */
export async function createManualEnrolment(req, res) {
  needRole(req, "manager");
  const body = req.body || {};
  const student = await Student.findById(objectId(body.studentId, "student")).lean();
  if (!student) throw new HttpError(400, "Choose a valid student.", "studentId");
  const course = await Course.findById(objectId(body.courseId, "course"));
  if (!course) throw new HttpError(400, "Choose a valid course.", "courseId");
  const batchId = String(body.batchId || "");
  if (!course.batches.some((b) => b.id === batchId)) throw new HttpError(400, "Choose a batch offered by this course.", "batchId");
  const status = body.status === "pending_payment" ? "pending_payment" : "paid";
  if (await Enrolment.exists({ studentRef: student._id, course: course._id, status: { $in: HOLDS_SEAT } })) {
    throw new HttpError(409, "This student is already enrolled in this course.");
  }

  if (!(await reserveSeatAnyStatus(course._id, batchId))) throw new HttpError(409, "This batch is full.", "batchId");
  const { pkrPerUsd } = await getSettings();
  const price = priceFor(course, pkrPerUsd);
  let enrolment;
  try {
    enrolment = await Enrolment.create({
      reference: newReference(),
      course: course._id,
      courseCode: course.code,
      courseTitle: course.title,
      batchId,
      studentRef: student._id,
      student: {
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        country: student.country || "Pakistan",
        identityNumber: student.identityNumber || "Not given",
        education: student.education || "Not given",
      },
      feeUsdCents: price.feeUsdCents,
      examFeeUsdCents: price.examFeeUsdCents,
      examIncludedByInstitute: course.examIncludedByInstitute,
      totalUsdCents: price.totalUsdCents,
      pkrPerUsd,
      status,
      paymentProvider: "manual",
      paymentNote: typeof body.paymentNote === "string" ? body.paymentNote.trim().slice(0, 300) : "",
      paidAt: status === "paid" ? new Date() : undefined,
    });
  } catch (err) {
    await releaseSeat(course._id, batchId);
    throw err;
  }
  await audit(req, "create", "enrolments", enrolment._id, `${enrolment.reference} ${student.fullName} ${course.code}`);
  res.status(201).json({ success: true, data: { id: String(enrolment._id), reference: enrolment.reference } });
}

/* Seat reservation that ignores whether the course is published, for desk bookings. */
async function reserveSeatAnyStatus(courseId, batchId) {
  const result = await Course.updateOne(
    { _id: courseId, batches: { $elemMatch: { id: batchId, seatsAvailable: { $gt: 0 } } } },
    { $inc: { "batches.$.seatsAvailable": -1 } },
  );
  return result.modifiedCount === 1;
}

/* Changes status, batch or payment note. The update only applies if the booking has not changed since it
   was read (a payment or an expiring hold may change it at the same moment), and seats move exactly once. */
export async function updateEnrolment(req, res) {
  needRole(req, "manager");
  const enrolment = await Enrolment.findById(objectId(req.params.id, "enrollment")).lean();
  if (!enrolment) throw new HttpError(404, "Enrollment not found.");
  const body = req.body || {};
  const nextStatus = body.status ?? enrolment.status;
  if (!["pending_payment", "paid", "expired", "cancelled", "refund_due"].includes(nextStatus)) throw new HttpError(400, "Choose a valid status.", "status");
  if (nextStatus === "refund_due" && enrolment.status !== "refund_due") throw new HttpError(400, "Only the payment system can mark a booking as refund due.", "status");
  const nextBatch = body.batchId ?? enrolment.batchId;

  const course = await Course.findById(enrolment.course).lean();
  if (!course) throw new HttpError(409, "The course for this enrollment no longer exists.");
  if (!course.batches.some((b) => b.id === nextBatch)) throw new HttpError(400, "Choose a batch offered by this course.", "batchId");

  const held = HOLDS_SEAT.includes(enrolment.status);
  const willHold = HOLDS_SEAT.includes(nextStatus);
  const batchChanged = nextBatch !== enrolment.batchId;
  const takesSeat = willHold && (!held || batchChanged);
  const freesSeat = held && (!willHold || batchChanged);

  // Take the new seat first, so a full batch stops the change before anything else happens.
  if (takesSeat && !(await reserveSeatAnyStatus(course._id, nextBatch))) throw new HttpError(409, "The chosen batch is full.", "batchId");

  const set = { status: nextStatus, batchId: nextBatch };
  if (nextStatus === "paid" && !enrolment.paidAt) set.paidAt = new Date();
  if (typeof body.paymentNote === "string") set.paymentNote = body.paymentNote.trim().slice(0, 300);
  const updated = await Enrolment.findOneAndUpdate(
    { _id: enrolment._id, status: enrolment.status, batchId: enrolment.batchId },
    { $set: set },
    { returnDocument: "after" },
  ).lean();
  if (!updated) {
    if (takesSeat) await releaseSeat(course._id, nextBatch);
    throw new HttpError(409, "This booking changed while you were editing it. Refresh and try again.");
  }
  if (freesSeat) await releaseSeat(course._id, enrolment.batchId);
  if (nextStatus === "paid") await linkStudent(updated);

  const changes = [];
  if (nextStatus !== enrolment.status) changes.push(`status ${enrolment.status} to ${nextStatus}`);
  if (batchChanged) changes.push(`batch ${enrolment.batchId} to ${nextBatch}`);
  await audit(req, "update", "enrolments", enrolment._id, `${enrolment.reference}: ${changes.join(", ") || "note updated"}`);
  res.json({ success: true, data: { id: String(updated._id), status: updated.status, batchId: updated.batchId } });
}

export async function deleteEnrolment(req, res) {
  needRole(req, "superadmin");
  const enrolment = await Enrolment.findById(objectId(req.params.id, "enrollment")).lean();
  if (!enrolment) throw new HttpError(404, "Enrollment not found.");
  await removeEnrolment(enrolment, req);
  res.json({ success: true });
}

export async function bulkDeleteEnrolments(req, res) {
  needRole(req, "superadmin");
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => mongoose.isValidObjectId(id)).slice(0, 500) : [];
  if (!ids.length) throw new HttpError(400, "Select at least one record.");
  const list = await Enrolment.find({ _id: { $in: ids } }).lean();
  for (const enrolment of list) await removeEnrolment(enrolment, req);
  res.json({ success: true, data: { deleted: list.length, skipped: [] } });
}

async function removeEnrolment(enrolment, req) {
  const result = await Enrolment.deleteOne({ _id: enrolment._id });
  if (result.deletedCount && HOLDS_SEAT.includes(enrolment.status)) await releaseSeat(enrolment.course, enrolment.batchId);
  await audit(req, "delete", "enrolments", enrolment._id, `${enrolment.reference} ${enrolment.student.fullName}`);
}

/* ------------------------------------------------------------------ Course batches */

/* Replaces a course's batches: adds new shifts, resizes existing ones atomically and
   removes batches only when no seat in them is booked. */
export async function updateCourseBatches(req, res) {
  needRole(req, "manager");
  const course = await Course.findById(objectId(req.params.id, "course")).lean();
  if (!course) throw new HttpError(404, "Course not found.");
  const wanted = Array.isArray(req.body?.batches) ? req.body.batches : null;
  if (!wanted) throw new HttpError(400, "Send the list of batches.");

  const shifts = new Map((await Shift.find({}).lean()).map((s) => [s.code, s]));
  const seen = new Set();
  for (const item of wanted) {
    if (!shifts.has(item?.id)) throw new HttpError(400, "Choose valid shifts for the batches.");
    if (seen.has(item.id)) throw new HttpError(400, "Each shift can only be used once per course.");
    seen.add(item.id);
    if (!Number.isInteger(item.capacity) || item.capacity < 0 || item.capacity > 1000) throw new HttpError(400, "Capacity must be a whole number from 0 to 1000.");
  }

  for (const batch of course.batches) {
    if (seen.has(batch.id)) continue;
    const booked = batch.capacity - batch.seatsAvailable;
    if (booked > 0) throw new HttpError(409, `${batch.label} has ${booked} booked seats, so it cannot be removed.`);
    await Course.updateOne({ _id: course._id }, { $pull: { batches: { id: batch.id, seatsAvailable: batch.capacity } } });
  }

  for (const item of wanted) {
    const shift = shifts.get(item.id);
    const existing = course.batches.find((b) => b.id === item.id);
    const label = typeof item.label === "string" && item.label.trim() ? item.label.trim().slice(0, 60) : `${shift.name} Batch`;
    const timing = typeof item.timing === "string" ? item.timing.trim().slice(0, 80) : `${shift.startTime} to ${shift.endTime}`;
    if (!existing) {
      await Course.updateOne({ _id: course._id }, { $push: { batches: { id: item.id, label, timing, capacity: item.capacity, seatsAvailable: item.capacity } } });
      continue;
    }
    await Course.updateOne({ _id: course._id, "batches.id": item.id }, { $set: { "batches.$.label": label, "batches.$.timing": timing } });
    const delta = item.capacity - existing.capacity;
    if (delta !== 0) {
      const result = await Course.updateOne(
        { _id: course._id, batches: { $elemMatch: { id: item.id, capacity: existing.capacity, seatsAvailable: { $gte: -delta } } } },
        { $inc: { "batches.$.capacity": delta, "batches.$.seatsAvailable": delta } },
      );
      if (result.modifiedCount !== 1) throw new HttpError(409, `${label} cannot be made smaller than the seats already booked.`);
    }
  }

  const updated = await Course.findById(course._id).lean();
  await audit(req, "update", "courses", course._id, `${course.code} batches: ${updated.batches.map((b) => `${b.id} ${b.capacity}`).join(", ")}`);
  res.json({ success: true, data: updated.batches });
}

/* ------------------------------------------------------------------ Check-in desk */

async function shiftFor(personType, person) {
  if (personType === "staff") return person.shift ? Shift.findOne({ code: person.shift }).lean() : null;
  const enrolment = await Enrolment.findOne({ studentRef: person._id, status: "paid" }).sort({ paidAt: -1 }).lean();
  if (!enrolment) return null;
  const shift = await Shift.findOne({ code: enrolment.batchId }).lean();
  return shift ? { ...shift, courseCode: enrolment.courseCode } : null;
}

const asRecord = (r) => r && { id: String(r._id), personType: r.personType, person: String(r.person), personCode: r.personCode, personName: r.personName, date: r.date, shift: r.shift, courseCode: r.courseCode, status: r.status, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt, note: r.note };

/* Finds students and staff by ID, name, phone or CNIC, with today's status. */
export async function lookupPeople(req, res) {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 60) : "";
  if (q.length < 2) return res.json({ success: true, data: [] });
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const or = (fields) => ({ $or: fields.map((f) => ({ [f]: re })) });
  const [students, staff] = await Promise.all([
    Student.find(or(["studentId", "fullName", "phone", "identityNumber", "email"])).limit(8).lean(),
    Staff.find(or(["staffId", "fullName", "phone", "identityNumber", "email"])).limit(6).lean(),
  ]);
  const { date } = localNow();
  const people = [
    ...students.map((s) => ({ personType: "student", id: String(s._id), code: s.studentId, name: s.fullName, detail: s.phone, status: s.status })),
    ...staff.map((s) => ({ personType: "staff", id: String(s._id), code: s.staffId, name: s.fullName, detail: s.role.replace("_", " "), status: s.status })),
  ];
  const today = await Attendance.find({ date, person: { $in: people.map((p) => p.id) } }).lean();
  const byPerson = new Map(today.map((r) => [String(r.person), asRecord(r)]));
  res.json({ success: true, data: people.map((p) => ({ ...p, today: byPerson.get(p.id) || null })) });
}

export async function checkIn(req, res) {
  const { personType, id, action } = req.body || {};
  if (!["student", "staff"].includes(personType) || !["in", "out"].includes(action)) throw new HttpError(400, "Choose a person and an action.");
  const Model = personType === "student" ? Student : Staff;
  const person = await Model.findById(objectId(id, "person")).lean();
  if (!person) throw new HttpError(404, "Person not found.");
  if (personType === "student" && person.status !== "active") throw new HttpError(409, `This student's status is ${person.status}. Only active students can check in.`);
  if (personType === "staff" && person.status === "inactive") throw new HttpError(409, "This staff member is inactive.");

  const now = new Date();
  const { date, time } = localNow(now);
  const code = person.studentId || person.staffId;
  let record = await Attendance.findOne({ personType, person: person._id, date });

  if (action === "in") {
    if (record?.checkInAt) throw new HttpError(409, `${person.fullName} already checked in today.`);
    const shift = await shiftFor(personType, person);
    const late = shift ? time > addMinutes(shift.startTime, shift.graceMinutes ?? 15) : false;
    const values = { checkInAt: now, status: late ? "late" : "present", shift: shift?.code || "", courseCode: shift?.courseCode || "", recordedBy: req.admin.email };
    if (record) Object.assign(record, values);
    else record = new Attendance({ personType, person: person._id, personModel: personType === "student" ? "Student" : "Staff", personCode: code, personName: person.fullName, date, ...values });
    await record.save();
  } else {
    if (!record?.checkInAt) throw new HttpError(409, `${person.fullName} has not checked in today.`);
    if (record.checkOutAt) throw new HttpError(409, `${person.fullName} already checked out today.`);
    record.checkOutAt = now;
    await record.save();
  }
  await audit(req, action === "in" ? "check_in" : "check_out", "attendance", record._id, `${code} ${person.fullName}`);
  res.json({ success: true, data: asRecord(record.toObject()) });
}

export async function todayAttendance(_req, res) {
  const { date } = localNow();
  const [records, activeStudents, activeStaff] = await Promise.all([
    Attendance.find({ date }).sort({ checkInAt: -1 }).limit(300).lean(),
    Student.countDocuments({ status: "active" }),
    Staff.countDocuments({ status: "active" }),
  ]);
  const count = (type, statuses) => records.filter((r) => r.personType === type && statuses.includes(r.status)).length;
  res.json({
    success: true,
    data: {
      date,
      records: records.map(asRecord),
      summary: {
        students: { active: activeStudents, present: count("student", ["present", "late"]), late: count("student", ["late"]), absent: count("student", ["absent"]) },
        staff: { active: activeStaff, present: count("staff", ["present", "late"]), late: count("staff", ["late"]), absent: count("staff", ["absent"]) },
        checkedOut: records.filter((r) => r.checkOutAt).length,
      },
    },
  });
}

/* Marks everyone without a record on the given day as absent. */
export async function markAbsent(req, res) {
  needRole(req, "manager");
  const date = typeof req.body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date) ? req.body.date : localNow().date;
  const include = ["student", "staff"].includes(req.body?.personType) ? [req.body.personType] : ["student", "staff"];
  const existing = new Set((await Attendance.find({ date }, { person: 1 }).lean()).map((r) => String(r.person)));
  const docs = [];
  if (include.includes("student")) {
    const enrolled = await Enrolment.distinct("studentRef", { status: "paid" });
    const list = await Student.find({ _id: { $in: enrolled }, status: "active" }).lean();
    for (const s of list) if (!existing.has(String(s._id))) docs.push({ personType: "student", person: s._id, personModel: "Student", personCode: s.studentId, personName: s.fullName, date, status: "absent", recordedBy: req.admin.email });
  }
  if (include.includes("staff")) {
    const list = await Staff.find({ status: "active" }).lean();
    for (const s of list) if (!existing.has(String(s._id))) docs.push({ personType: "staff", person: s._id, personModel: "Staff", personCode: s.staffId, personName: s.fullName, date, shift: s.shift, status: "absent", recordedBy: req.admin.email });
  }
  if (docs.length) await Attendance.insertMany(docs, { ordered: false }).catch((err) => { if (err.code !== 11000) throw err; });
  await audit(req, "create", "attendance", "", `Marked ${docs.length} absent on ${date}`);
  res.json({ success: true, data: { marked: docs.length, date } });
}

/* ------------------------------------------------------------------ Dashboard */

export async function dashboard(_req, res) {
  const { date } = localNow();
  const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(`${date.slice(0, 7)}-01T00:00:00+05:00`);

  const [statusTotals, monthRevenue, daily, byCourse, courses, studentsByStatus, staffActive, todays, newEnquiries, recent, settings] = await Promise.all([
    Enrolment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, cents: { $sum: "$totalUsdCents" } } }]),
    Enrolment.aggregate([{ $match: { status: "paid", paidAt: { $gte: monthStart } } }, { $group: { _id: null, cents: { $sum: "$totalUsdCents" }, count: { $sum: 1 } } }]),
    Enrolment.aggregate([
      { $match: { status: "paid", paidAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "Asia/Karachi" } }, cents: { $sum: "$totalUsdCents" }, count: { $sum: 1 } } },
    ]),
    Enrolment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: "$courseCode", count: { $sum: 1 }, cents: { $sum: "$totalUsdCents" } } }]),
    Course.find({}, { code: 1, title: 1, lab: 1, batches: 1, published: 1 }).sort({ code: 1 }).lean(),
    Student.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Staff.countDocuments({ status: "active" }),
    Attendance.aggregate([{ $match: { date } }, { $group: { _id: { type: "$personType", status: "$status" }, count: { $sum: 1 } } }]),
    Enquiry.countDocuments({ status: "new" }),
    Enrolment.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    getSettings(),
  ]);

  const status = (s) => statusTotals.find((t) => t._id === s) || { count: 0, cents: 0 };
  const dailyMap = new Map(daily.map((d) => [d._id, d]));
  const series = [];
  for (let i = 29; i >= 0; i -= 1) {
    const key = localNow(new Date(Date.now() - i * 24 * 60 * 60 * 1000)).date;
    const day = dailyMap.get(key);
    series.push({ date: key, revenueUsd: (day?.cents || 0) / 100, enrolments: day?.count || 0 });
  }
  const capacity = courses.reduce((sum, c) => sum + c.batches.reduce((s, b) => s + b.capacity, 0), 0);
  const free = courses.reduce((sum, c) => sum + c.batches.reduce((s, b) => s + b.seatsAvailable, 0), 0);
  const today = (type, statuses) => todays.filter((t) => t._id.type === type && statuses.includes(t._id.status)).reduce((s, t) => s + t.count, 0);
  const courseCounts = new Map(byCourse.map((c) => [c._id, c]));
  const labTotals = { ai: 0, cyber: 0 };
  for (const c of courses) labTotals[c.lab] += courseCounts.get(c.code)?.count || 0;

  res.json({
    success: true,
    data: {
      kpis: {
        revenueUsd: status("paid").cents / 100,
        revenueMonthUsd: (monthRevenue[0]?.cents || 0) / 100,
        paidEnrolments: status("paid").count,
        pendingEnrolments: status("pending_payment").count,
        students: studentsByStatus.reduce((s, x) => s + x.count, 0),
        activeStudents: studentsByStatus.find((x) => x._id === "active")?.count || 0,
        staffActive,
        seatsCapacity: capacity,
        seatsBooked: capacity - free,
        presentToday: today("student", ["present", "late"]),
        lateToday: today("student", ["late"]),
        staffPresentToday: today("staff", ["present", "late"]),
        newEnquiries,
        pkrPerUsd: settings.pkrPerUsd,
      },
      series,
      statusBreakdown: ["paid", "pending_payment", "expired", "cancelled", "refund_due"].map((s) => ({ status: s, count: status(s).count })),
      labSplit: labTotals,
      courses: courses.map((c) => ({
        code: c.code,
        title: c.title,
        lab: c.lab,
        published: c.published,
        paid: courseCounts.get(c.code)?.count || 0,
        revenueUsd: (courseCounts.get(c.code)?.cents || 0) / 100,
        batches: c.batches.map((b) => ({ id: b.id, label: b.label, capacity: b.capacity, booked: b.capacity - b.seatsAvailable })),
      })),
      recent: recent.map((e) => ({ id: String(e._id), reference: e.reference, name: e.student.fullName, courseCode: e.courseCode, batchId: e.batchId, status: e.status, totalUsd: e.totalUsdCents / 100, createdAt: e.createdAt })),
    },
  });
}

/* Options for form drop-downs: shifts, centres, courses with batches, and students. */
export async function lookups(req, res) {
  const [shifts, centres, courses, institutes, labs, navParents] = await Promise.all([
    Shift.find({}).sort({ startTime: 1 }).lean(),
    Centre.find({}).sort({ name: 1 }).lean(),
    Course.find({}, { code: 1, title: 1, batches: 1, published: 1, lab: 1 }).sort({ code: 1 }).lean(),
    Institute.find({}, { name: 1, slug: 1, active: 1 }).sort({ order: 1, name: 1 }).lean(),
    Lab.find({}, { name: 1, slug: 1, visible: 1 }).sort({ order: 1 }).lean(),
    NavItem.find({ parent: null, kind: "link" }, { label: 1 }).sort({ order: 1 }).lean(),
  ]);
  const q = typeof req.query.students === "string" ? req.query.students.trim().slice(0, 60) : null;
  let students = [];
  if (q !== null) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    students = await Student.find(q ? { $or: [{ studentId: re }, { fullName: re }, { email: re }, { phone: re }] } : {}).sort({ createdAt: -1 }).limit(20).lean();
  }
  res.json({
    success: true,
    data: {
      shifts: shifts.map((s) => ({ value: s.code, label: `${s.name} (${s.startTime} to ${s.endTime})`, active: s.active })),
      centres: centres.map((c) => ({ value: c.code, label: `${c.name}, ${c.city}`, active: c.active })),
      courses: courses.map((c) => ({ value: String(c._id), code: c.code, label: `${c.code} ${c.title}`, batches: c.batches.map((b) => ({ value: b.id, label: `${b.label} (${b.seatsAvailable} of ${b.capacity} free)` })) })),
      students: students.map((s) => ({ value: String(s._id), label: `${s.studentId} ${s.fullName} (${s.email})` })),
      institutes: institutes.map((i) => ({ value: String(i._id), slug: i.slug, label: i.name, active: i.active })),
      labs: labs.map((l) => ({ value: l.slug, label: l.name, active: l.visible })),
      navParents: navParents.map((n) => ({ value: String(n._id), label: n.label })),
    },
  });
}
