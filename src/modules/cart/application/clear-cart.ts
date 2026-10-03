import { type Cart, clearLines } from "@/modules/cart/domain/cart";
import type { CartRepository } from "./ports";

/**
 * Empties the cart of `cartId` (keeping its id), e.g. after an order is
 * placed. Returns null when there is no cart.
 */
export async function clearCart(
  carts: CartRepository,
  cartId: string | undefined,
): Promise<Cart | null> {
  const cart = cartId === undefined ? null : await carts.get(cartId);
  if (!cart) return null;

  const cleared = clearLines(cart);
  await carts.save(cleared);
  return cleared;
}
