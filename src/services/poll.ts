/** Poll `check` until it reports a non-"pending" status, or timeout elapses. */
export async function pollUntilResolved<T extends { status: string }>(
  check: () => Promise<T>,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<T> {
  const intervalMs = opts.intervalMs ?? 2500;
  const timeoutMs = opts.timeoutMs ?? 5 * 60 * 1000;
  const start = Date.now();

  for (;;) {
    const result = await check();
    if (result.status !== "pending") return result;
    if (Date.now() - start > timeoutMs) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
