import type { CartLine } from "@/modules/cart/domain/cart";
import { summarizeCart } from "@/modules/cart/domain/cart-summary";
import { type DayRange, quoteShipping, type ShippingQuote } from "./shipping";

export type CheckoutTotals = {
  itemCount: number;
  /** In céntimos. */
  subtotal: number;
  /** The latest backorder's lead time, or null without backorders. */
  leadTimeDays: DayRange | null;
  /** Null until the shipping address is known. */
  shipping: ShippingQuote | null;
  /** Subtotal plus shipping, in céntimos; null until shipping is known. */
  total: number | null;
};

/**
 * What the customer pays: the cart subtotal plus shipping to the address. The
 * same function prices the summary and the order, so they never disagree.
 * Prices include taxes (boletas under Nuevo RUS: no IGV breakdown).
 */
export function checkoutTotals(
  lines: readonly CartLine[],
  ubigeo: { departamento: string; provincia: string } | null,
): CheckoutTotals {
  const summary = summarizeCart(lines);
  const shipping = ubigeo ? quoteShipping(ubigeo, summary.leadTimeDays) : null;
  const total = shipping ? summary.subtotal + shipping.cost : null;
  if (total !== null && !Number.isSafeInteger(total)) {
    throw new RangeError(`The order total is not a safe integer: ${total}`);
  }
  return {
    itemCount: summary.itemCount,
    subtotal: summary.subtotal,
    leadTimeDays: summary.leadTimeDays,
    shipping,
    total,
  };
}
