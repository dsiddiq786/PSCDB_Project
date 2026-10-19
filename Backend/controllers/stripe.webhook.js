import Course from "../DBModels/Course.js";
import Enrolment from "../DBModels/Enrolment.js";
import { closeUnpaid } from "../services/enrolment.service.js";
import { linkStudent } from "../services/people.service.js";
import { stripe, stripeEnabled, testKeysAllowed } from "../services/stripe.service.js";

/* Takes a seat again for a booking whose hold had already ended. */
async function retakeSeat(courseId, batchId) {
  const result = await Course.updateOne(
    { _id: courseId, batches: { $elemMatch: { id: batchId, seatsAvailable: { $gt: 0 } } } },
    { $inc: { "batches.$.seatsAvailable": -1 } },
  );
  return result.modifiedCount === 1;
}

/* Records a successful payment. Every path ends in a recorded state: a payment is never dropped. */
export async function recordPayment(session, reference) {
  const match = { reference, stripeSessionId: session.id };
  // Normal case: the seat is still held.
  let paid = await Enrolment.findOneAndUpdate({ ...match, status: "pending_payment" }, { $set: { status: "paid", paidAt: new Date() } }, { returnDocument: "after" }).lean();
  if (paid) return linkStudent(paid);

  const booking = await Enrolment.findOne(match).lean();
  if (!booking) return null;
  if (booking.status === "paid" || booking.status === "refund_due") {
    // A retried event: make sure the student record exists.
    if (booking.status === "paid" && !booking.studentRef) await linkStudent(booking);
    return null;
  }
  // Paid after the hold ended or the booking was canceled: take a seat again if one is free,
  // otherwise flag the booking so staff refund it.
  const seat = await retakeSeat(booking.course, booking.batchId);
  paid = await Enrolment.findOneAndUpdate(
    { ...match, status: booking.status },
    { $set: seat ? { status: "paid", paidAt: new Date() } : { status: "refund_due", paidAt: new Date(), paymentNote: "Paid after the seat hold ended and the batch was full. Refund or move to another batch." } },
    { returnDocument: "after" },
  ).lean();
  if (!paid && seat) {
    // Another event changed the booking first; give the seat back.
    await Course.updateOne({ _id: booking.course, "batches.id": booking.batchId }, { $inc: { "batches.$.seatsAvailable": 1 } });
    return null;
  }
  if (paid?.status === "paid") await linkStudent(paid);
  if (paid?.status === "refund_due") console.error(`Payment needs a refund: ${reference}`);
  return paid;
}

/* Receives Stripe events. The raw body is required to verify the signature. */
export async function stripeWebhook(req, res) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(404).end();

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send("Invalid signature");
  }
  // In production, test-mode events are refused unless test payments were explicitly allowed.
  if (!event.livemode && !testKeysAllowed()) return res.status(400).send("Test-mode event refused");

  const session = event.data.object;
  const reference = session?.metadata?.reference;
  const succeeded =
    (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
    event.type === "checkout.session.async_payment_succeeded";

  if (succeeded && reference) await recordPayment(session, reference);
  if ((event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") && reference) {
    await closeUnpaid({ reference, stripeSessionId: session.id }, "expired");
  }

  res.json({ received: true });
}
