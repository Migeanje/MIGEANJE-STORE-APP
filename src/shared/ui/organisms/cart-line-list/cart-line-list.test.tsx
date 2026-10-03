import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { BACKORDER_LINE, IN_STOCK_LINE } from "./__fixtures__/cart-lines";
import { CartLineList } from "./cart-line-list";

const LINES = [IN_STOCK_LINE, BACKORDER_LINE];

describe("CartLineList", () => {
  it("lists each product with a stepper and a remove button named after it", () => {
    render(<CartLineList lines={LINES} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const second = within(items[1] as HTMLElement);
    expect(
      second.getByRole("spinbutton", {
        name: "Cantidad de Nano Charger 45W Smart Display (Blanco)",
      }),
    ).toHaveValue("1");
    expect(
      second.getByRole("button", {
        name: "Quitar Nano Charger 45W Smart Display (Blanco) del carrito",
      }),
    ).toBeInTheDocument();
  });

  it("limits each stepper to the line maximum", () => {
    render(<CartLineList lines={LINES} />);

    expect(
      screen.getByRole("spinbutton", {
        name: "Cantidad de Nano Charger 45W Smart Display (Blanco)",
      }),
    ).toHaveAttribute("aria-valuemax", "2");
  });

  it("reports quantity changes and removals by SKU", async () => {
    const user = userEvent.setup();
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    render(
      <CartLineList
        lines={LINES}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
      />,
    );

    const [first] = screen.getAllByRole("listitem");
    await user.click(
      within(first as HTMLElement).getByRole("button", {
        name: "Aumentar cantidad",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Quitar Prime Charger 100W, 3 puertos del carrito",
      }),
    );

    expect(onQuantityChange).toHaveBeenCalledWith("ANK-A2688", 3);
    expect(onRemove).toHaveBeenCalledWith("ANK-A2688");
  });

  it("is controlled: the quantity only changes when the caller says so", async () => {
    const user = userEvent.setup();
    render(<CartLineList lines={LINES} onQuantityChange={vi.fn()} />);

    const [first] = screen.getAllByRole("listitem");
    await user.click(
      within(first as HTMLElement).getByRole("button", {
        name: "Aumentar cantidad",
      }),
    );

    expect(
      screen.getByRole("spinbutton", {
        name: "Cantidad de Prime Charger 100W, 3 puertos",
      }),
    ).toHaveValue("2");
  });

  it("renders custom controls instead", () => {
    render(
      <CartLineList
        lines={LINES}
        renderControls={(line) => <span>Controles de {line.sku}</span>}
      />,
    );

    expect(screen.getByText("Controles de ANK-A2688")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<CartLineList lines={LINES} />);

    await expectNoAxeViolations(container);
  });
});
