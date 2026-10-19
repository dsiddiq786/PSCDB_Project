import Student from "../DBModels/Student.js";
import Enrolment from "../DBModels/Enrolment.js";
import { nextCode } from "../DBModels/Counter.js";

/* Finds the student with this email, or creates one, and links the booking to them.
   Called whenever a booking becomes paid, whichever way it was paid. */
export async function linkStudent(enrolment) {
  if (!enrolment || enrolment.studentRef) return enrolment?.studentRef || null;
  const { fullName, email, phone, country, identityNumber, education } = enrolment.student;
  let student = await Student.findOne({ email }).lean();
  if (!student) {
    try {
      student = await Student.create({
        studentId: await nextCode("student", "STU", 5),
        fullName,
        email,
        phone,
        country,
        identityNumber,
        education,
        source: enrolment.paymentProvider === "manual" ? "desk" : "online",
      });
    } catch (err) {
      // Another request created the same student a moment ago.
      if (err.code !== 11000) throw err;
      student = await Student.findOne({ email }).lean();
    }
  }
  await Enrolment.updateOne({ _id: enrolment._id }, { $set: { studentRef: student._id } });
  return student._id;
}

/* Creates student records for paid bookings made before students were tracked. */
export async function backfillStudents() {
  const unlinked = await Enrolment.find({ status: "paid", studentRef: { $exists: false } }).limit(1000).lean();
  for (const enrolment of unlinked) await linkStudent(enrolment);
  return unlinked.length;
}

/* Today's date and time in Pakistan, where the centres are. */
export function localNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, weekday: parts.weekday.toLowerCase().slice(0, 3) };
}

export function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
