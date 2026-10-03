import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import CartPage, { metadata } from "@/app/(transactional)/carrito/page";
import type { CartLine } from "@/modules/cart/domain/cart";
import { aCart, aLine } from "@/modules/cart/testing/cart-builders";

const loadCart = vi.hoisted(() => vi.fn());
vi.mock("@/modules/cart/ui/cart-data", () => ({ loadCart }));

vi.mock("@/modules/cart/ui/cart-page.container", () => ({
  CartPageContainer: ({
    emptyState,
    serverLines,
  }: {
    emptyState?: ReactNode;
    serverLines?: CartLine[];
  }) => (
    <div>
      <p>Contenido del carrito: {serverLines?.length ?? "sin datos"} líneas</p>
      {emptyState}
    </div>
  ),
}));

vi.mock("@/modules/catalog/ui/category-shortcuts.container", () => ({
  CategoryShortcutsContainer: () => <nav aria-label="Explora por categoría" />,
}));

describe("CartPage", () => {
  it("renders the cart page with category shortcuts for an empty cart", async () => {
    loadCart.mockResolvedValue(null);
    render(await CartPage());

    expect(
      screen.getByText("Contenido del carrito: 0 líneas"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
  });

  it("puts the cart of the cookie in the server HTML (works without JavaScript)", async () => {
    loadCart.mockResolvedValue(aCart([aLine({ quantity: 2 })]));
    render(await CartPage());

    expect(
      screen.getByText("Contenido del carrito: 1 líneas"),
    ).toBeInTheDocument();
  });

  it("is titled Carrito and kept out of search engines", () => {
    expect(metadata).toEqual({ title: "Carrito", robots: { index: false } });
  });
});
