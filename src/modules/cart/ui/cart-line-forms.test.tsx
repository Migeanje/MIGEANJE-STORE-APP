import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartLineForms } from "./cart-line-forms";

const actions = vi.hoisted(() => ({
  updateQuantityAction: vi.fn(),
  removeLineAction: vi.fn(),
}));
vi.mock("./actions", () => actions);

const LINE = {
  sku: "ANK-A121D-WHT",
  href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
  name: "Nano Charger 45W Smart Display",
  displayName: "Nano Charger 45W Smart Display (Blanco)",
  image: { src: "/mock/products/cargadores.svg", width: 640, height: 640 },
  availability: {
    status: "backorder" as const,
    label: "En importación · llega en 15–20 días",
  },
  unitPrice: 24890,
  lineTotal: 24890,
  quantity: 1,
  maxQuantity: 2,
};

describe("CartLineForms (no JavaScript)", () => {
  beforeEach(() => {
    actions.updateQuantityAction.mockReset();
    actions.removeLineAction.mockReset();
  });

  it("posts the typed quantity with the SKU and shows the answer", async () => {
    const user = userEvent.setup();
    actions.updateQuantityAction.mockResolvedValue({
      ok: true,
      message:
        "Ahora tienes 2 unidades de Nano Charger 45W Smart Display (Blanco).",
    });
    render(<CartLineForms line={LINE} />);

    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    await user.click(
      screen.getByRole("button", {
        name: "Actualizar la cantidad de Nano Charger 45W Smart Display (Blanco)",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Ahora tienes 2"),
    );
    const formData = actions.updateQuantityAction.mock
      .calls[0]?.[1] as FormData;
    expect(formData.get("sku")).toBe("ANK-A121D-WHT");
    expect(formData.get("cantidad")).toBe("2");
  });

  it("posts a removal and shows an error answer", async () => {
    const user = userEvent.setup();
    actions.removeLineAction.mockResolvedValue({
      ok: false,
      message: "No pudimos actualizar tu carrito.",
    });
    render(<CartLineForms line={LINE} />);

    await user.click(
      screen.getByRole("button", {
        name: "Quitar Nano Charger 45W Smart Display (Blanco) del carrito",
      }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveClass("text-destructive"),
    );
    const formData = actions.removeLineAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("sku")).toBe("ANK-A121D-WHT");
  });

  it("limits the quantity to the line maximum", () => {
    render(<CartLineForms line={LINE} />);

    expect(
      screen.getByRole("spinbutton", {
        name: "Cantidad de Nano Charger 45W Smart Display (Blanco)",
      }),
    ).toHaveAttribute("aria-valuemax", "2");
  });

  it("has no axe violations", async () => {
    const { container } = render(<CartLineForms line={LINE} />);

    await expectNoAxeViolations(container);
  });
});
