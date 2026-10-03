"use client";

import { CartButton } from "@/shared/ui/molecules/cart-button";
import { CART_PATH } from "./cart-paths";
import { useCart } from "./cart-provider";

/**
 * The header cart control: a link to /carrito in the server HTML (no-JS
 * fallback), a button opening the drawer once hydrated. The count includes
 * pending (optimistic) changes.
 */
export function CartHeaderButton() {
  const { view, open, openCart } = useCart();
  return (
    <CartButton
      count={view.itemCount}
      href={CART_PATH}
      onOpen={openCart}
      expanded={open}
    />
  );
}
