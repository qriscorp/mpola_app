/** A loan's term is either `duration` (months, standard) or `durationDays`
 * (an "emergency" short-term loan, 1-29 days, single bullet repayment) —
 * exactly one is ever set. Use this wherever a duration is displayed
 * instead of assuming `duration` alone, which is null for emergency loans. */
export function formatDuration(
  duration: number | null | undefined,
  durationDays: number | null | undefined,
): string {
  if (durationDays != null) {
    return `${durationDays} day${durationDays === 1 ? "" : "s"}`;
  }
  if (duration != null) {
    return `${duration} month${duration === 1 ? "" : "s"}`;
  }
  return "—";
}
