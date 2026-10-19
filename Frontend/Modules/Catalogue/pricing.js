/* Shared money helpers. Amounts are in US dollars; PKR is shown using the admin-set rate. */
export function formatUsd(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "To be confirmed";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

export function formatPkr(amountUsd, rate) {
  if (amountUsd === null || amountUsd === undefined || !rate) return null;
  return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(amountUsd * rate))}`;
}

export function totals(course) {
  const examChargedUsd = course.examIncludedByInstitute ? 0 : course.examFeeUsd;
  return { feeUsd: course.feeUsd, examFeeUsd: course.examFeeUsd, examChargedUsd, totalUsd: course.feeUsd + examChargedUsd };
}

export function seatsLeft(course) {
  return (course.batches || []).reduce((sum, batch) => sum + (batch.seatsAvailable ?? 0), 0);
}
