import {
  type Cart,
  type CartLine,
  type CartLineProduct,
  type QuantityClamp,
  setLineQuantity,
} from "@/modules/cart/domain/cart";
import type { CartServices } from "./ports";

export type UpdateLineQuantityRequest = { sku: string; quantity: number };

export type UpdateLineQuantityError =
  | { code: "not_in_cart" }
  /** The catalog no longer has the SKU; `product` is the line's snapshot. */
  | { code: "unknown_sku"; product: CartLineProduct }
  | { code: "unavailable"; product: CartLineProduct };

export type UpdateLineQuantityOutcome =
  | { ok: true; cart: Cart; line: CartLine; clamped: QuantityClamp | null }
  | { ok: false; error: UpdateLineQuantityError };

/**
 * Sets the units of a line already in the cart, re-reading price and
 * availability from the catalog (clamped to the current limit). On any error
 * the cart is left as it was.
 */
export async function updateLineQuantity(
  { carts, products }: CartServices,
  cartId: string | undefined,
  { sku, quantity }: UpdateLineQuantityRequest,
): Promise<UpdateLineQuantityOutcome> {
  const cart = cartId === undefined ? null : await carts.get(cartId);
  const line = cart?.lines.find((entry) => entry.sku === sku);
  if (!cart || !line) return { ok: false, error: { code: "not_in_cart" } };

  const offer = await products.findOffer(sku);
  if (!offer) {
    return { ok: false, error: { code: "unknown_sku", product: line.product } };
  }

  const result = setLineQuantity(cart, offer, quantity);
  if (!result.ok) {
    return result.reason === "unavailable"
      ? { ok: false, error: { code: "unavailable", product: offer.product } }
      : { ok: false, error: { code: "not_in_cart" } };
  }

  await carts.save(result.cart);
  return {
    ok: true,
    cart: result.cart,
    line: result.line,
    clamped: result.clamped,
  };
}
