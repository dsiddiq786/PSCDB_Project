import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import PublicRoutes from "./Routes/publicRoutes.js";
import AdminRoutes from "./Routes/adminRoutes.js";
import connectDB from "./config/db.js";
import { runSeed } from "./seed/seed.js";
import { backfillStudents } from "./services/people.service.js";
import { stripeWebhook } from "./controllers/stripe.webhook.js";
import { expireStaleHolds } from "./services/enrolment.service.js";
import { checkStripeConfig } from "./services/stripe.service.js";
import mongoose from "mongoose";

const app = express();

// Behind a reverse proxy, set TRUST_PROXY (for example "1") so rate limits see real client IPs.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

app.use(helmet());
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Stripe needs the raw body to verify signatures, so this route comes before JSON parsing.
app.post("/api/v1/payments/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(cookieParser());
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/", (_req, res) => res.send("PSCDB API is running"));
app.get("/api/v1/health", (_req, res) => res.json({ success: true }));

// API responses can contain personal data: never store them in browser or proxy caches.
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api/v1", PublicRoutes);
app.use("/api/v1/admin", AdminRoutes);

app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Not found." }));

// Last resort: never leak stack traces to clients.
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") return res.status(400).json({ success: false, message: "Invalid request body." });
  if (err?.type === "entity.too.large") return res.status(413).json({ success: false, message: "Request is too large." });
  if (err?.expose && err.status) return res.status(err.status).json({ success: false, message: err.message, field: err.field });
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({ success: false, field, message: `A record with this ${field || "value"} already exists.` });
  }
  if (err?.name === "ValidationError") {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ success: false, field: first?.path, message: first?.message || "Some details are not valid." });
  }
  if (err?.name === "CastError") return res.status(400).json({ success: false, field: err.path, message: "Some details are not valid." });
  console.error("Unhandled error:", err?.message);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 3002;

let server;
let sweep;

try {
  checkStripeConfig();
  await connectDB();
  await runSeed();
  await backfillStudents();
  sweep = setInterval(() => expireStaleHolds().catch((err) => console.error("Hold sweep failed:", err.message)), 60 * 1000);
  server = app.listen(PORT, () => console.log(`PSCDB API running on port ${PORT}`));
} catch (err) {
  console.error("Startup failed:", err.message);
  process.exit(1);
}

/* On shutdown (for example a redeploy), finish requests in progress, such as a payment webhook, before exiting. */
function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  clearInterval(sweep);
  server?.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 9000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err?.message || err));
