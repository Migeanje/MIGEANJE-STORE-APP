import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/modules/cart/domain/cart";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import type { AddToCartAction } from "@/modules/catalog/ui/add-to-cart";
import { PurchaseForm } from "@/modules/catalog/ui/purchase-form";
import { expectNoAxeViolations } from "@/test/a11y";
import { CartDrawerContainer } from "./cart-drawer.container";
import type { CartActionResult } from "./cart-form";
import { CartHeaderButton } from "./cart-header-button";
import { CartProvider, useCart } from "./cart-provider";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

type Deferred = {
  promise: Promise<CartActionResult>;
  resolve: (result: CartActionResult) => void;
};
function deferred(): Deferred {
  let resolve: Deferred["resolve"] = () => {};
  const promise = new Promise<CartActionResult>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const actions = vi.hoisted(() => ({
  updateQuantityAction: vi.fn(),
  removeLineAction: vi.fn(),
  readCartAction: vi.fn(),
}));
vi.mock("./actions", () => actions);

const LINES: CartLine[] = [
  aLine({ quantity: 2 }),
  aLine({}, aBackorderOffer()),
];

function Cart({
  lines = LINES,
  addToCart,
}: {
  lines?: CartLine[];
  addToCart?: AddToCartAction;
}) {
  return (
    <CartProvider lines={lines}>
      <CartHeaderButton />
      {addToCart ? (
        <PurchaseForm sku="ANK-A2688" maxQuantity={5} action={addToCart} />
      ) : null}
      <CartDrawerContainer emptyState={<p>Categorías</p>} />
    </CartProvider>
  );
}

function drawer() {
  return screen.getByRole("dialog", { name: "Tu carrito" });
}

describe("CartProvider with the header button and the drawer", () => {
  beforeEach(() => {
    navigation.pathname = "/";
    actions.updateQuantityAction.mockReset();
    actions.removeLineAction.mockReset();
    actions.readCartAction.mockReset();
  });

  it("shows the count in the header and opens the drawer from it", async () => {
    const user = userEvent.setup();
    render(<Cart />);

    const button = screen.getByRole("button", { name: "Carrito, 3 productos" });
    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(drawer()).toHaveAccessibleDescription("3 productos");
    expect(within(drawer()).getAllByRole("spinbutton")).toHaveLength(2);
  });

  it("opens the drawer after a successful add and announces it with focus", async () => {
    const user = userEvent.setup();
    const addToCart = vi.fn<AddToCartAction>(async () => ({
      ok: true,
      message: "Agregaste Prime Charger 100W, 3 puertos al carrito",
    }));
    render(<Cart addToCart={addToCart} />);

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Tu carrito" });
    const status = within(dialog).getByRole("status");
    expect(status).toHaveTextContent(
      "Agregaste Prime Charger 100W, 3 puertos al carrito",
    );
    expect(status).toHaveFocus();
  });

  it("keeps the drawer closed when the add fails", async () => {
    const user = userEvent.setup();
    const addToCart = vi.fn<AddToCartAction>(async () => ({
      ok: false,
      message: "Ya tienes 5 unidades.",
    }));
    render(<Cart addToCart={addToCart} />);

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    await screen.findByText("Ya tienes 5 unidades.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("changes a quantity optimistically and sends it to the server", async () => {
    const user = userEvent.setup();
    const answer = deferred();
    actions.updateQuantityAction.mockReturnValue(answer.promise);
    const { rerender } = render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));

    const [first] = within(drawer()).getAllByRole("listitem");
    await user.click(
      within(first as HTMLElement).getByRole("button", {
        name: "Aumentar cantidad",
      }),
    );

    // Before the server answers: the stepper and the header count moved.
    expect(
      within(drawer()).getByRole("spinbutton", {
        name: "Cantidad de Prime Charger 100W, 3 puertos",
      }),
    ).toHaveValue("3");
    expect(drawer()).toHaveAccessibleDescription("4 productos");
    const formData = actions.updateQuantityAction.mock
      .calls[0]?.[1] as FormData;
    expect(formData.get("sku")).toBe("ANK-A2688");
    expect(formData.get("cantidad")).toBe("3");

    // The server accepts and `refresh()` brings the new lines.
    rerender(<Cart lines={[aLine({ quantity: 3 }), LINES[1] as CartLine]} />);
    await act(async () => {
      answer.resolve({ ok: true, message: "Ahora tienes 3 unidades." });
    });

    expect(drawer()).toHaveAccessibleDescription("4 productos");
    expect(within(drawer()).getByRole("status")).toBeEmptyDOMElement();
  });

  it("rolls a failed change back and says why", async () => {
    const user = userEvent.setup();
    const answer = deferred();
    actions.updateQuantityAction.mockReturnValue(answer.promise);
    render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));

    const [first] = within(drawer()).getAllByRole("listitem");
    await user.click(
      within(first as HTMLElement).getByRole("button", {
        name: "Aumentar cantidad",
      }),
    );
    expect(drawer()).toHaveAccessibleDescription("4 productos");

    await act(async () => {
      answer.resolve({
        ok: false,
        message:
          "Prime Charger 100W, 3 puertos se agotó: no pudimos cambiar la cantidad.",
      });
    });

    expect(drawer()).toHaveAccessibleDescription("3 productos");
    const status = within(drawer()).getByRole("status");
    expect(status).toHaveTextContent("se agotó");
    expect(status).toHaveClass("text-destructive");
  });

  it("treats a failed request like a failed change", async () => {
    const user = userEvent.setup();
    actions.removeLineAction.mockRejectedValue(new Error("offline"));
    render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));

    await user.click(
      screen.getByRole("button", {
        name: "Quitar Prime Charger 100W, 3 puertos del carrito",
      }),
    );

    await waitFor(() =>
      expect(within(drawer()).getByRole("status")).toHaveTextContent(
        "No pudimos actualizar tu carrito.",
      ),
    );
    // The optimistic removal is undone once the transition settles.
    await waitFor(() =>
      expect(within(drawer()).getAllByRole("spinbutton")).toHaveLength(2),
    );
  });

  it("removes a line optimistically and announces the removal", async () => {
    const user = userEvent.setup();
    const answer = deferred();
    actions.removeLineAction.mockReturnValue(answer.promise);
    const { rerender } = render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));

    await user.click(
      screen.getByRole("button", {
        name: "Quitar Prime Charger 100W, 3 puertos del carrito",
      }),
    );

    expect(within(drawer()).getAllByRole("spinbutton")).toHaveLength(1);
    expect(within(drawer()).getByRole("status")).toHaveFocus();

    rerender(<Cart lines={[LINES[1] as CartLine]} />);
    await act(async () => {
      answer.resolve({
        ok: true,
        message: "Quitaste Prime Charger 100W, 3 puertos del carrito.",
      });
    });

    expect(within(drawer()).getByRole("status")).toHaveTextContent(
      "Quitaste Prime Charger 100W, 3 puertos del carrito.",
    );
    // The open drawer hides the page (aria-hidden) from assistive tech.
    expect(
      screen.getByRole("button", { name: "Carrito, 1 producto", hidden: true }),
    ).toBeInTheDocument();
  });

  it("shows the empty state with its extra content", async () => {
    const user = userEvent.setup();
    render(<Cart lines={[]} />);

    await user.click(
      screen.getByRole("button", { name: "Carrito, 0 productos" }),
    );

    expect(
      within(drawer()).getByRole("heading", { name: "Tu carrito está vacío" }),
    ).toBeInTheDocument();
    expect(within(drawer()).getByText("Categorías")).toBeInTheDocument();
  });

  it("closes the drawer when the page changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));
    expect(drawer()).toBeInTheDocument();

    navigation.pathname = "/checkout";
    rerender(<Cart />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has no axe violations with the drawer open", async () => {
    const user = userEvent.setup();
    render(<Cart />);
    await user.click(screen.getByRole("button", { name: /^Carrito/ }));

    await expectNoAxeViolations(document.body);
  });

  it("refuses to be used outside a CartProvider", () => {
    function Orphan() {
      useCart();
      return null;
    }
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Orphan />)).toThrow(
      "useCart must be used inside a CartProvider",
    );
  });
});

/** The layout's provider: no lines from the server, it loads them itself. */
function SelfLoadingCart({ addToCart }: { addToCart?: AddToCartAction }) {
  return (
    <CartProvider>
      <CartHeaderButton />
      {addToCart ? (
        <PurchaseForm sku="ANK-A2688" maxQuantity={5} action={addToCart} />
      ) : null}
      <CartDrawerContainer emptyState={<p>Categorías</p>} />
    </CartProvider>
  );
}

describe("CartProvider loading the cart itself (root layout)", () => {
  beforeEach(() => {
    navigation.pathname = "/";
    actions.updateQuantityAction.mockReset();
    actions.removeLineAction.mockReset();
    actions.readCartAction.mockReset();
  });

  it("keeps the header a plain link until the cart is loaded", async () => {
    let resolveLines: (lines: CartLine[]) => void = () => {};
    actions.readCartAction.mockReturnValue(
      new Promise<CartLine[]>((resolve) => {
        resolveLines = resolve;
      }),
    );
    render(<SelfLoadingCart />);

    expect(screen.getByRole("link", { name: "Carrito" })).toHaveAttribute(
      "href",
      "/carrito",
    );

    await act(async () => resolveLines(LINES));
    expect(
      screen.getByRole("button", { name: "Carrito, 3 productos" }),
    ).toBeInTheDocument();
    expect(actions.readCartAction).toHaveBeenCalledTimes(1);
  });

  it("loads the cart again when the page changes (e.g. after paying)", async () => {
    actions.readCartAction.mockResolvedValueOnce(LINES).mockResolvedValue([]);
    const { rerender } = render(<SelfLoadingCart />);
    expect(
      await screen.findByRole("button", { name: "Carrito, 3 productos" }),
    ).toBeInTheDocument();

    navigation.pathname = "/checkout/confirmacion/MG-2026-000123";
    rerender(<SelfLoadingCart />);

    expect(
      await screen.findByRole("button", { name: "Carrito, 0 productos" }),
    ).toBeInTheDocument();
    expect(actions.readCartAction).toHaveBeenCalledTimes(2);
  });

  it("loads the cart again after a change the server accepted", async () => {
    const user = userEvent.setup();
    actions.readCartAction
      .mockResolvedValueOnce(LINES)
      .mockResolvedValue([aLine({ quantity: 3 }), LINES[1] as CartLine]);
    actions.updateQuantityAction.mockResolvedValue({
      ok: true,
      message: "Ahora tienes 3 unidades.",
    });
    render(<SelfLoadingCart />);
    await user.click(
      await screen.findByRole("button", { name: "Carrito, 3 productos" }),
    );

    const [first] = within(drawer()).getAllByRole("listitem");
    await user.click(
      within(first as HTMLElement).getByRole("button", {
        name: "Aumentar cantidad",
      }),
    );

    await waitFor(() =>
      expect(actions.readCartAction).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(drawer()).toHaveAccessibleDescription("4 productos"),
    );
  });

  it("opens the drawer after an add with the lines loaded again", async () => {
    const user = userEvent.setup();
    actions.readCartAction
      .mockResolvedValueOnce([])
      .mockResolvedValue([aLine({ quantity: 1 })]);
    const addToCart = vi.fn<AddToCartAction>(async () => ({
      ok: true,
      message: "Agregaste Prime Charger 100W, 3 puertos al carrito",
    }));
    render(<SelfLoadingCart addToCart={addToCart} />);
    await screen.findByRole("button", { name: "Carrito, 0 productos" });

    await user.click(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    );

    const dialog = await screen.findByRole("dialog", { name: "Tu carrito" });
    expect(dialog).toHaveAccessibleDescription("1 producto");
    expect(within(dialog).getByRole("status")).toHaveFocus();
  });
});
