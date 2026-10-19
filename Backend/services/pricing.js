/* All amounts are calculated on the server from the course record.
   The browser never sends a price. */
export function priceFor(course, pkrPerUsd) {
  const examChargedCents = course.examIncludedByInstitute ? 0 : course.examFeeUsdCents;
  const totalUsdCents = course.feeUsdCents + examChargedCents;
  return {
    feeUsdCents: course.feeUsdCents,
    examFeeUsdCents: course.examFeeUsdCents,
    examChargedCents,
    totalUsdCents,
    totalPkr: Math.round((totalUsdCents / 100) * pkrPerUsd),
  };
}
