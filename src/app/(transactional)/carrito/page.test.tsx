import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import CartPage, { metadata } from "@/app/(transactional)/carrito/page";

vi.mock("@/modules/cart/ui/cart-page.container", () => ({
  CartPageContainer: ({ emptyState }: { emptyState?: ReactNode }) => (
    <div>
      <p>Contenido del carrito</p>
      {emptyState}
    </div>
  ),
}));

vi.mock("@/modules/catalog/ui/category-shortcuts.container", () => ({
  CategoryShortcutsContainer: () => <nav aria-label="Explora por categoría" />,
}));

describe("CartPage", () => {
  it("renders the cart page with category shortcuts for an empty cart", () => {
    render(<CartPage />);

    expect(screen.getByText("Contenido del carrito")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Explora por categoría" }),
    ).toBeInTheDocument();
  });

  it("is titled Carrito and kept out of search engines", () => {
    expect(metadata).toEqual({ title: "Carrito", robots: { index: false } });
  });
});
