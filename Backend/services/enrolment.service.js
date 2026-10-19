import { randomBytes } from "node:crypto";
import Course from "../DBModels/Course.js";
import Enrolment from "../DBModels/Enrolment.js";

export const HOLD_MINUTES = 31;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/* Unguessable booking reference, for example PSCDB-7K4MX9QH2A. */
export function newReference() {
  const bytes = randomBytes(10);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `PSCDB-${out}`;
}

/* Takes one seat only if one is free. Atomic, so two buyers cannot take the last seat. */
export async function reserveSeat(courseId, batchId) {
  const result = await Course.updateOne(
    { _id: courseId, published: true, batches: { $elemMatch: { id: batchId, seatsAvailable: { $gt: 0 } } } },
    { $inc: { "batches.$.seatsAvailable": -1 } },
  );
  return result.modifiedCount === 1;
}

export async function releaseSeat(courseId, batchId) {
  await Course.updateOne(
    { _id: courseId, "batches.id": batchId },
    { $inc: { "batches.$.seatsAvailable": 1 } },
  );
}

/* Moves an unpaid booking to a final state and gives the seat back, once only. */
export async function closeUnpaid(filter, status) {
  const enrolment = await Enrolment.findOneAndUpdate(
    { ...filter, status: "pending_payment" },
    { $set: { status } },
    { returnDocument: "after" },
  );
  if (enrolment) await releaseSeat(enrolment.course, enrolment.batchId);
  return enrolment;
}

/* Releases seats held by bookings that were never paid. A two-minute grace
   period lets a payment that finishes at the deadline still be recorded. */
export async function expireStaleHolds() {
  const stale = await Enrolment.find({ status: "pending_payment", holdExpiresAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }, { _id: 1 }).limit(200);
  for (const { _id } of stale) {
    await closeUnpaid({ _id }, "expired");
  }
  return stale.length;
}
