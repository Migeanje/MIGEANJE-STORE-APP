"use client";

import { CartButton } from "@/shared/ui/molecules/cart-button";
import { CART_PATH } from "./cart-paths";
import { useCart } from "./cart-provider";

/**
 * The header cart control: a link to /carrito in the server HTML (no-JS
 * fallback), a button opening the drawer once hydrated and the cart loaded.
 * The count includes pending (optimistic) changes. Until the browser has
 * loaded the cart (and without JavaScript) it is "Carrito", without a count.
 */
export function CartHeaderButton() {
  const { view, open, openCart } = useCart();
  return (
    <CartButton
      count={view?.itemCount}
      href={CART_PATH}
      onOpen={view ? openCart : undefined}
      expanded={open}
    />
  );
}
