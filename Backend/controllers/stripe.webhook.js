import Enrolment from "../DBModels/Enrolment.js";
import { closeUnpaid } from "../services/enrolment.service.js";
import { stripe, stripeEnabled } from "../services/stripe.service.js";

/* Receives Stripe events. The raw body is required to verify the signature. */
export async function stripeWebhook(req, res) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(404).end();

  let event;
  try {
    event = stripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send("Invalid signature");
  }

  const session = event.data.object;
  const reference = session?.metadata?.reference;

  if (event.type === "checkout.session.completed" && session.payment_status === "paid" && reference) {
    // Idempotent: only a pending booking with this session moves to paid.
    await Enrolment.updateOne(
      { reference, stripeSessionId: session.id, status: "pending_payment" },
      { $set: { status: "paid", paidAt: new Date() } },
    );
  }

  if (event.type === "checkout.session.expired" && reference) {
    await closeUnpaid({ reference, stripeSessionId: session.id }, "expired");
  }

  res.json({ received: true });
}
