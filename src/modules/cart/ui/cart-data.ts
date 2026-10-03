// Reading the cart in Server Components (layouts, pages, checkout).
import "server-only";
import { cache } from "react";
import { getCart } from "@/modules/cart/application/get-cart";
import type { Cart } from "@/modules/cart/domain/cart";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { readCartId } from "@/modules/cart/infrastructure/cart-cookie";

/**
 * The cart of this request's cookie, or null when there is none. Cached per
 * request (React `cache`), so the layout and a page can both call it. Reading
 * the cookie makes the route render per request.
 */
export const loadCart = cache(async (): Promise<Cart | null> => {
  return getCart(getCartRepository(), await readCartId());
});
