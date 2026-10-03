import type { Metadata } from "next";
import { CartPageContainer } from "@/modules/cart/ui/cart-page.container";
import { CategoryShortcutsContainer } from "@/modules/catalog/ui/category-shortcuts.container";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false },
};

/**
 * The cart as a page: deep links and the no-JavaScript fallback of the cart
 * drawer (its forms post to the cart's server actions).
 */
export default function CartPage() {
  return <CartPageContainer emptyState={<CategoryShortcutsContainer />} />;
}
