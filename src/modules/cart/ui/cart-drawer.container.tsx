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
  return (
    <CartDrawer
      open={cart.open}
      onOpenChange={cart.setOpen}
      lines={cart.view.lines}
      itemCountLabel={cart.view.itemCountLabel}
      subtotal={cart.view.subtotal}
      notes={cart.view.notes}
      status={cart.status}
      focusStatusOnOpen={cart.focusStatus}
      checkoutHref={CHECKOUT_PATH}
      emptyState={emptyState}
      onQuantityChange={cart.changeQuantity}
      onRemove={cart.removeLine}
    />
  );
}
