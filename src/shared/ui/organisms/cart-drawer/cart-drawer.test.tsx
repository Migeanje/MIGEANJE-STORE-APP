import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  BACKORDER_LINE,
  IN_STOCK_LINE,
} from "../cart-line-list/__fixtures__/cart-lines";
import { CartDrawer, type CartDrawerProps } from "./cart-drawer";

const NOTES = [
  "El envío se calcula en el checkout.",
  "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.",
];

function props(overrides: Partial<CartDrawerProps> = {}): CartDrawerProps {
  return {
    open: true,
    onOpenChange: vi.fn(),
    lines: [IN_STOCK_LINE, BACKORDER_LINE],
    itemCountLabel: "3 productos",
    subtotal: 62870,
    notes: NOTES,
    onQuantityChange: vi.fn(),
    onRemove: vi.fn(),
    ...overrides,
  };
}

function dialog() {
  return screen.getByRole("dialog", { name: "Tu carrito" });
}

describe("CartDrawer", () => {
  it("is a dialog named 'Tu carrito' and described by the item count", () => {
    render(<CartDrawer {...props()} />);

    expect(dialog()).toHaveAccessibleDescription("3 productos");
    expect(dialog()).toHaveAttribute("data-lenis-prevent");
  });

  it("renders nothing while closed", () => {
    render(<CartDrawer {...props({ open: false })} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("lists the lines with their controls and the summary", () => {
    render(<CartDrawer {...props()} />);

    const panel = within(dialog());
    expect(panel.getAllByRole("spinbutton")).toHaveLength(2);
    expect(panel.getByText(NOTES[1] as string)).toBeInTheDocument();
    expect(panel.getByRole("link", { name: "Ir a pagar" })).toHaveAttribute(
      "href",
      "/checkout",
    );
  });

  it("closes with 'Seguir comprando'", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CartDrawer {...props({ onOpenChange })} />);

    await user.click(screen.getByRole("button", { name: "Seguir comprando" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes when a link inside is followed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CartDrawer {...props({ onOpenChange })} />);
    const link = screen.getByRole("link", { name: "Ir a pagar" });
    link.addEventListener("click", (event) => event.preventDefault());

    await user.click(link);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("moves focus to the status before a line is removed", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<CartDrawer {...props({ onRemove })} />);

    await user.click(
      screen.getByRole("button", {
        name: "Quitar Prime Charger 100W, 3 puertos del carrito",
      }),
    );

    expect(onRemove).toHaveBeenCalledWith("ANK-A2688");
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("announces the status and focuses it when asked to on open", () => {
    render(
      <CartDrawer
        {...props({
          status: {
            message:
              "Agregaste Nano Charger 45W Smart Display (Blanco) al carrito",
          },
          focusStatusOnOpen: true,
        })}
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Agregaste Nano Charger 45W Smart Display (Blanco) al carrito",
    );
    expect(status).toHaveFocus();
  });

  it("keeps the default focus inside the panel otherwise", () => {
    render(<CartDrawer {...props()} />);

    expect(screen.getByRole("status")).not.toHaveFocus();
    expect(dialog()).toContainElement(document.activeElement as HTMLElement);
  });

  it("styles an error status", () => {
    render(
      <CartDrawer
        {...props({
          status: {
            message: "No pudimos actualizar tu carrito.",
            tone: "error",
          },
        })}
      />,
    );

    expect(screen.getByRole("status")).toHaveClass("text-destructive");
  });

  it("shows an empty state with extra content and no summary", () => {
    render(
      <CartDrawer
        {...props({
          lines: [],
          itemCountLabel: "0 productos",
          subtotal: 0,
          notes: [],
          emptyState: <a href="/categorias/cargadores">Cargadores</a>,
        })}
      />,
    );

    const panel = within(dialog());
    expect(
      panel.getByRole("heading", { level: 3, name: "Tu carrito está vacío" }),
    ).toBeInTheDocument();
    expect(panel.getByRole("link", { name: "Cargadores" })).toBeInTheDocument();
    expect(panel.queryByRole("link", { name: "Ir a pagar" })).toBeNull();
    expect(dialog()).not.toHaveAttribute("aria-describedby");
  });

  it("has no axe violations with lines, empty and with an error", async () => {
    const { rerender } = render(<CartDrawer {...props()} />);
    await expectNoAxeViolations(document.body);

    rerender(
      <CartDrawer
        {...props({
          lines: [],
          itemCountLabel: "0 productos",
          subtotal: 0,
          notes: [],
        })}
      />,
    );
    await expectNoAxeViolations(document.body);

    rerender(
      <CartDrawer
        {...props({
          status: {
            message: "No pudimos actualizar tu carrito.",
            tone: "error",
          },
        })}
      />,
    );
    await expectNoAxeViolations(document.body);
  });
});
