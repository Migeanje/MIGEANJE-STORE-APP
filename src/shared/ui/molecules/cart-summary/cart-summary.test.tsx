import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartSummary } from "./cart-summary";

const NBSP = " ";

const NOTES = [
  "El envío se calcula en el checkout.",
  "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.",
];

describe("CartSummary", () => {
  it("shows the subtotal with the item count", () => {
    render(
      <CartSummary
        subtotal={62870}
        itemCountLabel="3 productos"
        checkoutHref="/checkout"
      />,
    );

    expect(screen.getByRole("term")).toHaveTextContent(
      "Subtotal (3 productos)",
    );
    // textContent keeps the no-break space exact.
    expect(screen.getByRole("definition").textContent).toBe(`S/${NBSP}628.70`);
  });

  it("lists the notes", () => {
    render(
      <CartSummary
        subtotal={62870}
        itemCountLabel="3 productos"
        notes={NOTES}
        checkoutHref="/checkout"
      />,
    );

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(NOTES);
  });

  it("leads to checkout and renders the secondary action", () => {
    render(
      <CartSummary
        subtotal={18990}
        itemCountLabel="1 producto"
        checkoutHref="/checkout"
        secondaryAction={<a href="/">Seguir comprando</a>}
      />,
    );

    expect(screen.getByRole("link", { name: "Ir a pagar" })).toHaveAttribute(
      "href",
      "/checkout",
    );
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toBeInTheDocument();
  });

  it("has an optional heading", () => {
    const { rerender } = render(
      <CartSummary
        subtotal={0}
        itemCountLabel="0 productos"
        checkoutHref="/checkout"
      />,
    );
    expect(screen.queryByRole("heading")).toBeNull();

    rerender(
      <CartSummary
        subtotal={0}
        itemCountLabel="0 productos"
        checkoutHref="/checkout"
        title="Resumen"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Resumen" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <CartSummary
        subtotal={62870}
        itemCountLabel="3 productos"
        notes={NOTES}
        checkoutHref="/checkout"
        title="Resumen"
        secondaryAction={<a href="/">Seguir comprando</a>}
      />,
    );

    await expectNoAxeViolations(container);
  });
});
