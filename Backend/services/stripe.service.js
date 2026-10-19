import Stripe from "stripe";

let client = null;

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe() {
  if (!stripeEnabled()) throw new Error("Stripe is not configured.");
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/* Test keys (sk_test_) are refused in production unless STRIPE_TEST_MODE_ACK=true is set on purpose. */
export function testKeysAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.STRIPE_TEST_MODE_ACK === "true";
}

/* Stops the API from starting with a payment setup that would lose or fake payments. */
export function checkStripeConfig() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) return;
  if (process.env.NODE_ENV === "production" && !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET must be set when STRIPE_SECRET_KEY is set, or paid bookings are never confirmed.");
  }
  if (key.startsWith("sk_test_") && !testKeysAllowed()) {
    throw new Error("Stripe test keys are not allowed in production. Use live keys, or set STRIPE_TEST_MODE_ACK=true for a supervised test.");
  }
}

/* Ends a Checkout Session so it can no longer be paid. Returns false if it was already paid. */
export async function expireCheckout(sessionId) {
  if (!stripeEnabled() || !sessionId) return true;
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.status === "complete") return false;
  if (session.status === "open") await stripe().checkout.sessions.expire(sessionId);
  return true;
}

/* Simulated payments exist only to test the flow locally without Stripe keys. */
export function simulatedPaymentsAllowed() {
  return !stripeEnabled() && process.env.NODE_ENV !== "production" && process.env.ALLOW_SIMULATED_PAYMENTS === "true";
}

export async function createCheckoutSession({ enrolment, course, price, holdExpiresAt }) {
  const client = process.env.CLIENT_URL || "http://localhost:5173";
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: price.feeUsdCents,
        product_data: { name: `${course.code} ${course.title}`, description: `Course fee, ${enrolment.batchId} batch` },
      },
    },
  ];
  if (price.examChargedCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: price.examChargedCents, product_data: { name: `${course.code} exam fee` } },
    });
  }

  return stripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: enrolment.student.email,
    client_reference_id: enrolment.reference,
    metadata: { reference: enrolment.reference },
    expires_at: Math.floor(holdExpiresAt.getTime() / 1000),
    success_url: `${client}/enroll/confirmation?ref=${encodeURIComponent(enrolment.reference)}`,
    cancel_url: `${client}/enroll/${encodeURIComponent(course.slug)}?cancelled=${encodeURIComponent(enrolment.reference)}`,
  });
}
