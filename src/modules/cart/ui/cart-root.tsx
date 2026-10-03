import type { ReactNode } from "react";
import { CartDrawerContainer } from "./cart-drawer.container";
import { CartProvider } from "./cart-provider";

export type CartRootProps = {
  children: ReactNode;
  /** Extra content for the empty drawer, e.g. category links. */
  emptyState?: ReactNode;
};

/**
 * For the root layout: provides the cart to the page (header count, drawer,
 * cart page, "Agregar al carrito"), with the drawer rendered once after the
 * children. It never reads the cart cookie, so pages that do not need the
 * cart stay static: the browser loads the cart after the page
 * (`readCartAction`), and pages that need it on the server (cart, checkout)
 * read it themselves.
 */
export function CartRoot({ children, emptyState }: CartRootProps) {
  return (
    <CartProvider>
      {children}
      <CartDrawerContainer emptyState={emptyState} />
    </CartProvider>
  );
}
