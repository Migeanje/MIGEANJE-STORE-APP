import type { ReactNode } from "react";
import { loadCart } from "./cart-data";
import { CartDrawerContainer } from "./cart-drawer.container";
import { CartProvider } from "./cart-provider";

export type CartRootProps = {
  children: ReactNode;
  /** Extra content for the empty drawer, e.g. category links. */
  emptyState?: ReactNode;
};

/**
 * Server Component for the root layout: reads the cart from the cookie and
 * provides it to the page (header count, drawer, cart page, "Agregar al
 * carrito"), with the drawer rendered once after the children.
 */
export async function CartRoot({ children, emptyState }: CartRootProps) {
  const cart = await loadCart();
  return (
    <CartProvider lines={cart?.lines ?? []}>
      {children}
      <CartDrawerContainer emptyState={emptyState} />
    </CartProvider>
  );
}
