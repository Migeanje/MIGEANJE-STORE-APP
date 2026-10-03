import type { CartLine } from "./cart";

/**
 * How the order ships, as a message key the UI turns into copy:
 * - `ships_together_when_available`: in stock and backorder lines are mixed;
 *   the whole order ships together once everything has arrived.
 * - `ships_on_arrival`: every line is a backorder.
 * In-stock-only carts need no note (null).
 */
export type ShippingNoteKey =
  | "ships_together_when_available"
  | "ships_on_arrival";

export type CartSummary = {
  /** Units across every line. */
  itemCount: number;
  /** Sum of the line totals, in céntimos. */
  subtotal: number;
  hasBackorder: boolean;
  /** When the latest backorder arrives (business days); null without backorders. */
  leadTimeDays: { min: number; max: number } | null;
  shippingNote: ShippingNoteKey | null;
};

function assertSafeAmount(amount: number, what: string): number {
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`${what} is not a safe integer amount: ${amount}`);
  }
  return amount;
}

/** Unit price × quantity, in céntimos. Throws a RangeError on overflow. */
export function lineTotal(
  line: Pick<CartLine, "unitPrice" | "quantity">,
): number {
  return assertSafeAmount(line.unitPrice * line.quantity, "A line total");
}

/**
 * Derived totals of a cart: units, subtotal in céntimos and how it ships. A
 * mixed cart ships together when everything is available, so its lead time is
 * the latest backorder's (the largest min and the largest max).
 */
export function summarizeCart(lines: readonly CartLine[]): CartSummary {
  let itemCount = 0;
  let subtotal = 0;
  let leadTimeDays: CartSummary["leadTimeDays"] = null;
  let hasInStock = false;

  for (const line of lines) {
    itemCount += line.quantity;
    subtotal = assertSafeAmount(subtotal + lineTotal(line), "The subtotal");
    if (line.availability.status === "in_stock") {
      hasInStock = true;
      continue;
    }
    const { min, max } = line.availability.leadTimeDays;
    leadTimeDays = leadTimeDays
      ? {
          min: Math.max(leadTimeDays.min, min),
          max: Math.max(leadTimeDays.max, max),
        }
      : { min, max };
  }

  const hasBackorder = leadTimeDays !== null;
  return {
    itemCount,
    subtotal,
    hasBackorder,
    leadTimeDays,
    shippingNote: !hasBackorder
      ? null
      : hasInStock
        ? "ships_together_when_available"
        : "ships_on_arrival",
  };
}
