import {
  type Cart,
  type CartLine,
  deleteLine,
} from "@/modules/cart/domain/cart";
import type { CartRepository } from "./ports";

/**
 * Removes the line of a SKU. Idempotent: removing what is not there (or
 * without a cart) changes nothing and answers `removed: null`.
 */
export async function removeLine(
  carts: CartRepository,
  cartId: string | undefined,
  sku: string,
): Promise<{ cart: Cart | null; removed: CartLine | null }> {
  const cart = cartId === undefined ? null : await carts.get(cartId);
  if (!cart) return { cart: null, removed: null };

  const result = deleteLine(cart, sku);
  if (result.removed) await carts.save(result.cart);
  return result;
}
