import type { Cart } from "@/modules/cart/domain/cart";
import type { CartRepository } from "./ports";

/** The cart of `cartId` (the cookie), or null when there is none. */
export async function getCart(
  carts: CartRepository,
  cartId: string | undefined,
): Promise<Cart | null> {
  return cartId === undefined ? null : carts.get(cartId);
}
