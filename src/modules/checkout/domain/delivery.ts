import type { DayRange } from "./shipping";

/*
 * Delivery dates. Business days are Monday to Friday; public holidays are not
 * skipped yet (DRAFT: the estimate may be a day or two early around them).
 * Dates are calendar dates in Lima ("2026-10-05"), which has no daylight
 * saving time: UTC−5 all year.
 */

const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The calendar date in Lima of an instant, e.g. "2026-10-03". */
export function limaDate(instant: Date): string {
  return new Date(instant.getTime() + LIMA_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function parseDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!DATE_PATTERN.test(date) || Number.isNaN(parsed.getTime())) {
    throw new RangeError(`Expected a date as YYYY-MM-DD, got "${date}"`);
  }
  return parsed;
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * The date `days` business days after `date` (weekends skipped). Throws a
 * RangeError for a malformed date or days that are not a non-negative integer.
 */
export function addBusinessDays(date: string, days: number): string {
  if (!Number.isSafeInteger(days) || days < 0) {
    throw new RangeError(
      `Business days must be a non-negative integer, got ${days}`,
    );
  }
  let current = parseDate(date);
  let left = days;
  while (left > 0) {
    current = new Date(current.getTime() + DAY_MS);
    if (!isWeekend(current)) left -= 1;
  }
  return current.toISOString().slice(0, 10);
}

/** First and last delivery dates for an order placed at `placedAt`. */
export function deliveryWindow(
  placedAt: Date,
  days: DayRange,
): { from: string; to: string } {
  const start = limaDate(placedAt);
  return {
    from: addBusinessDays(start, days.min),
    to: addBusinessDays(start, days.max),
  };
}
