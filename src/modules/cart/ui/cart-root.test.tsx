import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/modules/cart/domain/cart";
import { aLine } from "@/modules/cart/testing/cart-builders";
import { CartHeaderButton } from "./cart-header-button";
import { CartRoot } from "./cart-root";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const actions = vi.hoisted(() => ({
  updateQuantityAction: vi.fn(),
  removeLineAction: vi.fn(),
  readCartAction: vi.fn(),
}));
vi.mock("./actions", () => actions);

// No mock of `./cart-data`: CartRoot must not read the cart cookie (that
// would make every page render per request). Importing that server-only
// module here would fail.

describe("CartRoot", () => {
  it("renders the page without the cart; the browser loads it afterwards", async () => {
    let resolveLines: (lines: CartLine[]) => void = () => {};
    actions.readCartAction.mockReturnValue(
      new Promise<CartLine[]>((resolve) => {
        resolveLines = resolve;
      }),
    );

    // Not an async component: the layout never waits for the cart.
    const element = CartRoot({
      children: <CartHeaderButton />,
      emptyState: null,
    });
    expect(element).not.toBeInstanceOf(Promise);
    await act(async () => {
      render(element);
    });

    // Until the cart arrives (and without JavaScript) the header shows a
    // plain link to /carrito, without a count.
    expect(screen.getByRole("link", { name: "Carrito" })).toHaveAttribute(
      "href",
      "/carrito",
    );

    await act(async () => resolveLines([aLine({ quantity: 2 })]));

    expect(
      await screen.findByRole("button", { name: "Carrito, 2 productos" }),
    ).toBeInTheDocument();
  });

  it("shows an empty cart without a cookie", async () => {
    actions.readCartAction.mockResolvedValue([]);

    await act(async () => {
      render(CartRoot({ children: <CartHeaderButton /> }));
    });

    expect(
      await screen.findByRole("button", { name: "Carrito, 0 productos" }),
    ).toBeInTheDocument();
  });
});
