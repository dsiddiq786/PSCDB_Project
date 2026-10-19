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
    success_url: `${client}/enrol/confirmation?ref=${encodeURIComponent(enrolment.reference)}`,
    cancel_url: `${client}/enrol/${encodeURIComponent(course.slug)}?cancelled=${encodeURIComponent(enrolment.reference)}`,
  });
}
