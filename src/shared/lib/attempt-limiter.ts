/**
 * Counts failed attempts per key (e.g. a client address) in a fixed time
 * window. A key is blocked once it reaches the maximum failures, until its
 * window is over.
 *
 * In-memory and per server process: a best-effort guard for mock data and
 * development. Real rate limiting belongs to the edge (CDN/WAF) or the
 * backend, which see every instance and the real client address.
 */
export type AttemptLimiter = {
  /** Whether `key` used up its failures in the current window. */
  isBlocked(key: string): boolean;
  /** Counts one failure for `key` (a new window starts after the last one ends). */
  recordFailure(key: string): void;
  /** Keys with a window still open (for tests and diagnostics). */
  size(): number;
};

export type AttemptLimiterOptions = {
  /** Failures allowed per window, an integer of at least 1. */
  maxFailures: number;
  /** Window length in milliseconds, above 0. */
  windowMs: number;
  /** Current time in milliseconds; `Date.now` by default. */
  now?: () => number;
};

type Window = { failures: number; startedAt: number };

/** Throws a RangeError for limits outside their domain. */
export function createAttemptLimiter({
  maxFailures,
  windowMs,
  now = Date.now,
}: AttemptLimiterOptions): AttemptLimiter {
  if (!Number.isInteger(maxFailures) || maxFailures < 1) {
    throw new RangeError(
      `maxFailures must be an integer of at least 1, got ${maxFailures}`,
    );
  }
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new RangeError(`windowMs must be above 0, got ${windowMs}`);
  }

  const windows = new Map<string, Window>();
  const isOpen = (window: Window, time: number) =>
    time - window.startedAt < windowMs;

  function prune(time: number) {
    for (const [key, window] of windows) {
      if (!isOpen(window, time)) windows.delete(key);
    }
  }

  return {
    isBlocked(key) {
      const window = windows.get(key);
      return (
        window !== undefined &&
        isOpen(window, now()) &&
        window.failures >= maxFailures
      );
    },
    recordFailure(key) {
      const time = now();
      prune(time);
      const window = windows.get(key);
      if (window) {
        window.failures += 1;
      } else {
        windows.set(key, { failures: 1, startedAt: time });
      }
    },
    size() {
      return windows.size;
    },
  };
}
