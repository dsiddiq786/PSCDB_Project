/* Formatting for certification data. Official exam fees keep the currency the provider publishes. */
export function money(amount, currency = "USD") {
  if (amount === null || amount === undefined) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export const categoryLabel = (category) => (category === "ai_ml" ? "AI/ML" : category === "cybersecurity" ? "Cybersecurity" : "");

export const verifiedLabel = (date) => (date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");

export const certName = (cert) => (cert.code && !cert.title.includes(cert.code) ? `${cert.title} (${cert.code})` : cert.title);
