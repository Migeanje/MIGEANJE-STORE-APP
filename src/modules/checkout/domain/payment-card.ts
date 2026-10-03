import { limaDate } from "./delivery";

/*
 * Card checks for the simulated payment (Culqi arrives in F4, where Culqi's
 * own form tokenizes the card in the browser). Card data is only checked and
 * passed to the payment gateway: it is never stored, logged or echoed back.
 */

/** A card as the payment form sends it, already checked. Never persist it. */
export type PaymentCard = {
  /** Digits only. */
  number: string;
  expiry: CardExpiry;
  cvv: string;
  holderName: string;
};

export type CardExpiry = { month: number; year: number };

export const CVV_PATTERN = /^\d{3,4}$/;

/** Drops the spaces and hyphens people type between digit groups. */
export function normalizeCardNumber(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** True for 13 to 19 digits that pass the Luhn checksum. */
export function isLuhnValid(number: string): boolean {
  if (!/^\d{13,19}$/.test(number)) return false;
  let sum = 0;
  for (let index = 0; index < number.length; index += 1) {
    // From the right: every second digit is doubled.
    let digit = Number(number[number.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** "MM/AA", "MM/AAAA" or "MMAA" (spaces allowed), or null when malformed. */
export function parseCardExpiry(input: string): CardExpiry | null {
  const match =
    /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(input.trim()) ??
    /^(\d{2})(\d{2})$/.exec(input.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const yearText = match[2] as string;
  const year =
    yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

/** A card works through the last day of its expiry month (Lima time). */
export function isCardExpired(expiry: CardExpiry, now: Date): boolean {
  const [year, month] = limaDate(now).split("-").map(Number) as [
    number,
    number,
  ];
  return expiry.year < year || (expiry.year === year && expiry.month < month);
}

/** The last four digits, the only part of a card fit to show. */
export function cardLast4(number: string): string {
  return number.slice(-4);
}
