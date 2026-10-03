import {
  getDefaultNormalizer,
  render,
  screen,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { OrderSummary, type OrderSummaryProps } from "./order-summary";

const NBSP = " ";
const exact = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
};

const LINES: OrderSummaryProps["lines"] = [
  {
    key: "ANK-A2688",
    name: "Prime Charger 100W, 3 puertos",
    quantity: 2,
    lineTotal: 37980,
    availability: { status: "in_stock", label: "En stock" },
  },
  {
    key: "ANK-A121D-WHT",
    name: "Nano Charger 45W Smart Display",
    variantLabel: "Blanco",
    quantity: 1,
    lineTotal: 24890,
    availability: {
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    },
  },
];

function values(container: HTMLElement) {
  return [...container.querySelectorAll("dt")].map((term) => [
    term.textContent,
    term.nextElementSibling?.textContent,
  ]);
}

describe("OrderSummary", () => {
  it("lists every line with its quantity, availability and total", () => {
    render(
      <OrderSummary
        lines={LINES}
        subtotal={62870}
        shipping={1000}
        total={63870}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Prime Charger 100W, 3 puertos");
    expect(items[0]).toHaveTextContent("Cantidad: 2");
    expect(items[0]).toHaveTextContent("En stock");
    expect(
      within(items[0] as HTMLElement).getByText(`S/${NBSP}379.80`, exact),
    ).toBeInTheDocument();
    expect(items[1]).toHaveTextContent("Blanco");
    expect(items[1]).toHaveTextContent("En importación · llega en 15–20 días");
  });

  it("shows subtotal, shipping and total in soles", () => {
    const { container } = render(
      <OrderSummary
        lines={LINES}
        subtotal={62870}
        shipping={1000}
        shippingLabel="Envío a Lima Metropolitana"
        total={63870}
      />,
    );

    expect(values(container)).toEqual([
      ["Subtotal", `S/${NBSP}628.70`],
      ["Envío a Lima Metropolitana", `S/${NBSP}10.00`],
      ["Total", `S/${NBSP}638.70`],
    ]);
  });

  it("says shipping is pending until the address is known", () => {
    const { container } = render(
      <OrderSummary
        lines={LINES}
        subtotal={62870}
        shipping={null}
        total={null}
      />,
    );
    expect(values(container)).toEqual([
      ["Subtotal", `S/${NBSP}628.70`],
      ["Envío", "Se calcula con tu dirección"],
      ["Total", `S/${NBSP}628.70`],
    ]);
  });

  it("has a heading, notes and an action", () => {
    render(
      <OrderSummary
        title="Tu pedido"
        lines={LINES}
        subtotal={62870}
        shipping={1000}
        total={63870}
        notes={["Precios incluyen impuestos."]}
        action={<a href="/carrito">Editar carrito</a>}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Tu pedido" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Precios incluyen impuestos.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Editar carrito" }),
    ).toHaveAttribute("href", "/carrito");
  });

  it("can collapse on phones behind a disclosure that shows the total", () => {
    const { container } = render(
      <OrderSummary
        collapsible
        lines={LINES}
        subtotal={62870}
        shipping={1000}
        total={63870}
      />,
    );

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).toHaveClass("lg:hidden");
    // textContent keeps the no-break space exact.
    expect(details?.querySelector("summary")?.textContent).toBe(
      `Ver detalle (3 productos)S/${NBSP}638.70`,
    );
    // The wide layout shows the same content without the disclosure.
    expect(container.querySelector(".hidden.lg\\:flex")).not.toBeNull();
  });

  it("keeps the notes (delivery, lead time) outside the disclosure, once", () => {
    const { container } = render(
      <OrderSummary
        collapsible
        lines={LINES}
        subtotal={62870}
        shipping={1000}
        total={63870}
        notes={["Entrega en 18–25 días hábiles."]}
      />,
    );

    const note = screen.getByText("Entrega en 18–25 días hábiles.");
    expect(container.querySelector("details")).not.toContainElement(note);
    expect(screen.getAllByText("Entrega en 18–25 días hábiles.")).toHaveLength(
      1,
    );
  });

  it("has no axe violations, collapsible or not", async () => {
    const { container } = render(
      <>
        <OrderSummary
          title="Resumen del pedido"
          lines={LINES}
          subtotal={62870}
          shipping={1000}
          total={63870}
          notes={["Precios incluyen impuestos."]}
        />
        <OrderSummary
          title="Resumen en el celular"
          collapsible
          lines={LINES}
          subtotal={62870}
          shipping={null}
          total={null}
        />
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
