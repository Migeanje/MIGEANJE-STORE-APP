import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { aCart, aLine } from "@/modules/cart/testing/cart-builders";
import { CartHeaderButton } from "./cart-header-button";
import { CartRoot } from "./cart-root";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("./actions", () => ({
  updateQuantityAction: vi.fn(),
  removeLineAction: vi.fn(),
}));

const loadCart = vi.hoisted(() => vi.fn());
vi.mock("./cart-data", () => ({ loadCart }));

describe("CartRoot", () => {
  it("provides the cart of the cookie to the page", async () => {
    loadCart.mockResolvedValue(aCart([aLine({ quantity: 2 })]));

    render(
      await CartRoot({ children: <CartHeaderButton />, emptyState: null }),
    );

    expect(
      screen.getByRole("button", { name: "Carrito, 2 productos" }),
    ).toBeInTheDocument();
  });

  it("provides an empty cart without a cookie", async () => {
    loadCart.mockResolvedValue(null);

    render(await CartRoot({ children: <CartHeaderButton /> }));

    expect(
      screen.getByRole("button", { name: "Carrito, 0 productos" }),
    ).toBeInTheDocument();
  });
});
