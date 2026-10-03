import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import type { AddToCartAction } from "./add-to-cart";
import { AddToCartFeedbackProvider } from "./add-to-cart-feedback";
import { PurchaseForm } from "./purchase-form";

describe("PurchaseForm", () => {
  it("offers a quantity up to the maximum and 'Agregar al carrito'", () => {
    render(<PurchaseForm sku="ANK-A2688" maxQuantity={5} />);

    const quantity = screen.getByRole("spinbutton", { name: "Cantidad" });
    expect(quantity).toHaveValue("1");
    expect(quantity).toHaveAttribute("aria-valuemax", "5");
    expect(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    ).toBeInTheDocument();
  });

  it("posts the SKU and the quantity to the cart action and announces its answer", async () => {
    const user = userEvent.setup();
    const action = vi.fn<AddToCartAction>(async () => ({
      ok: true,
      message: "Agregaste 2 unidades al carrito.",
    }));
    render(<PurchaseForm sku="ANK-A2688" maxQuantity={5} action={action} />);

    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Agregaste 2 unidades al carrito.",
      ),
    );
    const formData = action.mock.calls[0]?.[1];
    expect(formData?.get("sku")).toBe("ANK-A2688");
    expect(formData?.get("cantidad")).toBe("2");
  });

  it("tells the cart once about each successful add", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    const action = vi.fn<AddToCartAction>(async () => ({
      ok: true,
      message: "Agregaste Prime Charger 100W, 3 puertos al carrito",
    }));
    const { rerender } = render(
      <AddToCartFeedbackProvider onAdded={onAdded}>
        <PurchaseForm sku="ANK-A2688" maxQuantity={5} action={action} />
      </AddToCartFeedbackProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );
    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(1));
    expect(onAdded).toHaveBeenCalledWith({
      ok: true,
      message: "Agregaste Prime Charger 100W, 3 puertos al carrito",
    });

    // A new listener identity does not report the same answer again.
    rerender(
      <AddToCartFeedbackProvider onAdded={(result) => onAdded(result)}>
        <PurchaseForm sku="ANK-A2688" maxQuantity={5} action={action} />
      </AddToCartFeedbackProvider>,
    );
    expect(onAdded).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );
    await waitFor(() => expect(onAdded).toHaveBeenCalledTimes(2));
  });

  it("does not tell the cart about a failed add", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    const action = vi.fn<AddToCartAction>(async () => ({
      ok: false,
      message: "Ya tienes 5 unidades en tu carrito.",
    }));
    render(
      <AddToCartFeedbackProvider onAdded={onAdded}>
        <PurchaseForm sku="ANK-A2688" maxQuantity={5} action={action} />
      </AddToCartFeedbackProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Ya tienes 5 unidades en tu carrito.",
      ),
    );
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("says the cart is not ready yet without an action", async () => {
    const user = userEvent.setup();
    render(<PurchaseForm sku="ANK-A2688" maxQuantity={2} />);

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /El carrito llega muy pronto/,
      ),
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PurchaseForm sku="ANK-A2688" maxQuantity={2} />,
    );

    await expectNoAxeViolations(container);
  });
});
