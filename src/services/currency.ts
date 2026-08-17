/** Compact UGX amount for tight stat tiles — picks the right unit instead of
 * always dividing by a million, which made anything under ~1M read as a
 * meaningless "0.0M". 500 -> "500", 5,000 -> "5K", 500,000 -> "500K",
 * 5,000,000 -> "5M". Trims a trailing ".0" so whole units don't show one. */
export function formatCompactUGX(amount: number | null | undefined): string {
  const n = amount ?? 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  const withSuffix = (value: number, suffix: string) => {
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${sign}${text}${suffix}`;
  };

  if (abs >= 1_000_000) return withSuffix(abs / 1_000_000, "M");
  if (abs >= 1_000) return withSuffix(abs / 1_000, "K");
  return `${sign}${Math.round(abs)}`;
}
