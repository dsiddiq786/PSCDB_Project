import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import UserAuthRoutes from "./Routes/userAuthRoutes.js";
import StudentRoutes from "./Routes/studentRoutes.js";
import PublicRoutes from "./Routes/publicRoutes.js";
import AdminRoutes from "./Routes/adminRoutes.js";
import connectDB from "./config/db.js";
import { runSeed } from "./seed/seed.js";
import { stripeWebhook } from "./controllers/stripe.webhook.js";
import { expireStaleHolds } from "./services/enrolment.service.js";

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

app.use("/api/v1", PublicRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/auth", UserAuthRoutes);
app.use("/api/v1/lms/student/", StudentRoutes);

app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Not found." }));

// Last resort: never leak stack traces to clients.
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") return res.status(400).json({ success: false, message: "Invalid request body." });
  if (err?.type === "entity.too.large") return res.status(413).json({ success: false, message: "Request is too large." });
  console.error("Unhandled error:", err?.message);
  res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
});

const PORT = process.env.PORT || 3002;

try {
  await connectDB();
  await runSeed();
  setInterval(() => expireStaleHolds().catch((err) => console.error("Hold sweep failed:", err.message)), 60 * 1000);
  app.listen(PORT, () => console.log(`PSCDB API running on port ${PORT}`));
} catch (err) {
  console.error("Startup failed:", err.message);
  process.exit(1);
}
