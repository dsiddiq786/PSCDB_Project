import Enquiry from "../DBModels/Enquiry.js";

const TOPICS = ["admission", "programme", "payment", "research", "partnership", "opportunity", "other"];

export async function createEnquiry(req, res) {
  const body = req.body || {};
  const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const enquiry = {
    name: text(body.name, 100),
    email: text(body.email, 254).toLowerCase(),
    phone: text(body.phone, 20),
    topic: TOPICS.includes(body.topic) ? body.topic : "other",
    courseSlug: /^[a-z0-9-]{0,120}$/.test(body.courseSlug || "") ? body.courseSlug || "" : "",
    message: text(body.message, 3000),
  };

  if (enquiry.name.length < 2) return res.status(400).json({ success: false, field: "name", message: "Enter your name." });
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(enquiry.email)) return res.status(400).json({ success: false, field: "email", message: "Enter a valid email address." });
  if (enquiry.phone && !/^\+?[0-9 ()-]{7,20}$/.test(enquiry.phone)) return res.status(400).json({ success: false, field: "phone", message: "Enter a valid phone number, or leave it empty." });
  if (enquiry.message.length < 10) return res.status(400).json({ success: false, field: "message", message: "Write a message of at least 10 characters." });

  await Enquiry.create(enquiry);
  res.status(201).json({ success: true, message: "Thank you. Your message has been sent, and our team will reply by email." });
}
