import type { Metadata } from "next";
import { loadCart } from "@/modules/cart/ui/cart-data";
import { CartPageContainer } from "@/modules/cart/ui/cart-page.container";
import { CategoryShortcutsContainer } from "@/modules/catalog/ui/category-shortcuts.container";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

/**
 * The cart as a page: deep links and the no-JavaScript fallback of the cart
 * drawer (its forms post to the cart's server actions). It reads the cart
 * cookie itself (the root layout does not), so the lines are in the server
 * HTML.
 */
export default async function CartPage() {
  const cart = await loadCart();
  return (
    <CartPageContainer
      serverLines={cart?.lines ?? []}
      emptyState={<CategoryShortcutsContainer />}
    />
  );
}
