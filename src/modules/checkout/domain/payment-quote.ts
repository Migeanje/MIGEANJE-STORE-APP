import type { CartLine, LineAvailability } from "@/modules/cart/domain/cart";
import { checkoutTotals } from "./checkout-totals";

/**
 * What the payment page asks the customer to pay: the total in céntimos and a
 * fingerprint of everything that decides it (each line's SKU, quantity, unit
 * price and availability, and the shipping zone and cost). The page posts
 * both back; placing the order recomputes them from the cart as it is then
 * and refuses to charge when they differ (e.g. the cart changed in another
 * tab). The posted total is only compared, never charged.
 */
export type PaymentQuote = { total: number; fingerprint: string };

/** 8 lowercase hex digits (FNV-1a, 32 bits). */
export const PAYMENT_QUOTE_FINGERPRINT_PATTERN = /^[0-9a-f]{8}$/;

function availabilityKey(availability: LineAvailability): string {
  return availability.status === "backorder"
    ? `backorder:${availability.leadTimeDays.min}-${availability.leadTimeDays.max}`
    : availability.status;
}

/**
 * FNV-1a over the UTF-16 code units. Not a security measure: the server
 * charges what it computes itself; the fingerprint only tells whether the
 * customer saw the same cart.
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * The quote of the payment step, from the same `checkoutTotals` as the
 * summary and the order; null until the shipping address is known. Line order
 * does not matter.
 */
export function paymentQuote(
  lines: readonly CartLine[],
  ubigeo: { departamento: string; provincia: string } | null,
): PaymentQuote | null {
  const { shipping, total } = checkoutTotals(lines, ubigeo);
  if (!shipping || total === null) return null;

  const lineKeys = lines
    .map(
      (line) =>
        `${line.sku}*${line.quantity}@${line.unitPrice}:${availabilityKey(line.availability)}`,
    )
    .sort();
  const canonical = [
    "v1",
    ...lineKeys,
    `shipping:${shipping.zone}:${shipping.cost}`,
  ].join("|");
  return { total, fingerprint: fnv1a(canonical) };
}

/** Same total and same fingerprint. */
export function samePaymentQuote(a: PaymentQuote, b: PaymentQuote): boolean {
  return a.total === b.total && a.fingerprint === b.fingerprint;
}
