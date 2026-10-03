"use client";

import type { ReactNode } from "react";
import { CartDrawer } from "@/shared/ui/organisms/cart-drawer";
import { CHECKOUT_PATH } from "./cart-paths";
import { useCart } from "./cart-provider";

/** The cart drawer fed by the cart state (optimistic lines, actions). */
export function CartDrawerContainer({
  emptyState,
}: {
  emptyState?: ReactNode;
}) {
  const cart = useCart();
  const { view } = cart;
  // Nothing to show until the browser has loaded the cart.
  if (!view) return null;
  return (
    <CartDrawer
      open={cart.open}
      onOpenChange={cart.setOpen}
      lines={view.lines}
      itemCountLabel={view.itemCountLabel}
      subtotal={view.subtotal}
      notes={view.notes}
      status={cart.status}
      focusStatusOnOpen={cart.focusStatus}
      checkoutHref={CHECKOUT_PATH}
      emptyState={emptyState}
      onQuantityChange={cart.changeQuantity}
      onRemove={cart.removeLine}
    />
  );
}
