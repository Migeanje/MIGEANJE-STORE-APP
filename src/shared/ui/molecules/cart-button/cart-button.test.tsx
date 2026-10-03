import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartButton } from "./cart-button";

describe("CartButton", () => {
  it.each([
    [0, "Carrito, 0 productos"],
    [1, "Carrito, 1 producto"],
    [3, "Carrito, 3 productos"],
  ])("is a link to the cart named with its count (%i)", (count, name) => {
    render(<CartButton count={count} href="/carrito" />);

    expect(screen.getByRole("link", { name })).toHaveAttribute(
      "href",
      "/carrito",
    );
  });

  it("is a link named just 'Carrito' while the count is unknown", async () => {
    const { container } = render(<CartButton href="/carrito" />);

    expect(screen.getByRole("link", { name: "Carrito" })).toHaveAttribute(
      "href",
      "/carrito",
    );
    expect(screen.queryByTestId("cart-count")).toBeNull();
    await expectNoAxeViolations(container);
  });

  it("shows a decorative badge only above 0, capped at 99+", () => {
    const { rerender } = render(<CartButton count={0} href="/carrito" />);
    expect(screen.queryByTestId("cart-count")).toBeNull();

    rerender(<CartButton count={3} href="/carrito" />);
    expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
    expect(
      screen.getByTestId("cart-count").closest('[aria-hidden="true"]'),
    ).not.toBeNull();

    rerender(<CartButton count={120} href="/carrito" />);
    expect(screen.getByTestId("cart-count")).toHaveTextContent("99+");
  });

  it("becomes a button that opens the drawer once hydrated", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<CartButton count={2} href="/carrito" onOpen={onOpen} />);

    const button = screen.getByRole("button", { name: "Carrito, 2 productos" });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link")).toBeNull();

    await user.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("reports the drawer as expanded", () => {
    render(<CartButton count={2} href="/carrito" onOpen={vi.fn()} expanded />);

    expect(
      screen.getByRole("button", { name: "Carrito, 2 productos" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("stays a link in the server HTML, for no-JavaScript visits", () => {
    const html = renderToString(
      <CartButton count={2} href="/carrito" onOpen={vi.fn()} />,
    );

    expect(html).toContain('href="/carrito"');
    expect(html).not.toContain("<button");
  });

  it.each([-1, 1.5, Number.NaN])(
    "throws a RangeError for a count of %d",
    (count) => {
      expect(() =>
        render(<CartButton count={count} href="/carrito" />),
      ).toThrow(RangeError);
    },
  );

  it("has no axe violations as a link and as a button", async () => {
    const { container, rerender } = render(
      <CartButton count={3} href="/carrito" />,
    );
    await expectNoAxeViolations(container);

    rerender(<CartButton count={3} href="/carrito" onOpen={vi.fn()} />);
    await expectNoAxeViolations(container);
  });
});
