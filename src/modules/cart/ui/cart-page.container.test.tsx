import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/modules/cart/domain/cart";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartPageContainer } from "./cart-page.container";
import { CartProvider } from "./cart-provider";

vi.mock("next/navigation", () => ({ usePathname: () => "/carrito" }));

const actions = vi.hoisted(() => ({
  updateQuantityAction: vi.fn(async () => ({ ok: true, message: "" })),
  removeLineAction: vi.fn(async () => ({ ok: true, message: "Quitaste." })),
  // The layout's provider loads the cart in the browser: never, here.
  readCartAction: vi.fn(() => new Promise(() => {})),
}));
vi.mock("./actions", () => actions);

const LINES: CartLine[] = [
  aLine({ quantity: 2 }),
  aLine({}, aBackorderOffer()),
];

function Page({ lines = LINES }: { lines?: CartLine[] }) {
  return (
    <CartProvider lines={lines}>
      <CartPageContainer emptyState={<p>Explora por categoría</p>} />
    </CartProvider>
  );
}

describe("CartPageContainer", () => {
  beforeEach(() => {
    actions.updateQuantityAction.mockClear();
    actions.removeLineAction.mockClear();
  });

  it("shows the lines and the summary under 'Tu carrito'", () => {
    render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tu carrito" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 productos")).toBeInTheDocument();
    const lines = screen.getByRole("region", { name: "Productos" });
    expect(
      within(lines).getByRole("heading", {
        level: 3,
        name: "Nano Charger 45W Smart Display",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Resumen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a pagar" })).toHaveAttribute(
      "href",
      "/checkout",
    );
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByText(/lo enviamos completo cuando todo esté disponible/),
    ).toBeInTheDocument();
  });

  it("uses the optimistic controls once hydrated", async () => {
    const user = userEvent.setup();
    render(<Page />);

    expect(screen.queryByRole("button", { name: /^Actualizar/ })).toBeNull();
    await user.click(
      screen.getByRole("button", {
        name: "Quitar Prime Charger 100W, 3 puertos del carrito",
      }),
    );

    expect(actions.removeLineAction).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
    expect(screen.getAllByRole("status")[0]).toHaveFocus();
  });

  it("shows the server's lines while the browser has not loaded the cart (no JavaScript)", () => {
    const html = renderToString(
      <CartProvider>
        <CartPageContainer serverLines={LINES} />
      </CartProvider>,
    );

    expect(html).toContain("Nano Charger 45W Smart Display");
    expect(html).toContain("3 productos");
    expect(html).toContain('name="cantidad"');
  });

  it("renders forms that post without JavaScript in the server HTML", () => {
    const html = renderToString(<Page />);

    expect(html.match(/<form/g)).toHaveLength(4);
    expect(html).toContain("Actualizar");
    expect(html).toContain('name="cantidad"');
    expect(html).toContain('name="sku" value="ANK-A121D-WHT"');
  });

  it("offers a way back and the extra content when the cart is empty", () => {
    render(<Page lines={[]} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Tu carrito está vacío" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("Explora por categoría")).toBeInTheDocument();
    expect(screen.queryByText(/productos?$/)).toBeNull();
  });

  it("has no axe violations with lines and empty", async () => {
    const { container, unmount } = render(<Page />);
    await expectNoAxeViolations(container);
    unmount();

    const empty = render(<Page lines={[]} />);
    await expectNoAxeViolations(empty.container);
  });
});
