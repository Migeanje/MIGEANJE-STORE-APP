import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  OrderConfirmation,
  type OrderConfirmationProps,
} from "./order-confirmation";

const PROPS: OrderConfirmationProps = {
  orderNumber: "MG-2026-004521",
  email: "ana@correo.pe",
  delivery: {
    title: "Llega entre el miércoles 28 de octubre y el viernes 6 de noviembre",
    detail: "Envío a Arequipa · 18–25 días hábiles",
  },
  backorderNote:
    "Tu pedido incluye productos en importación: lo enviamos completo cuando todo llegue.",
  receipt: "Boleta de venta electrónica · DNI 46027897",
  shippingAddress: ["Calle Mercaderes 210", "Cayma, Arequipa, Arequipa"],
  nextSteps: [
    "Confirmamos tu pago.",
    "Pedimos tus productos en importación.",
    "Te avisamos cuando salga a reparto.",
  ],
  summary: {
    lines: [
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
    ],
    subtotal: 24890,
    shipping: 2000,
    shippingLabel: "Envío a Arequipa",
    total: 26890,
    notes: ["Precios incluyen impuestos."],
  },
  trackingHref: "/pedidos/seguimiento?numero=MG-2026-004521",
  continueHref: "/",
};

describe("OrderConfirmation", () => {
  it("thanks the customer and shows the order number in mono", () => {
    render(<OrderConfirmation {...PROPS} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "¡Gracias por tu compra!",
      }),
    ).toBeInTheDocument();
    const number = screen.getByText("MG-2026-004521");
    expect(number).toHaveClass("font-mono");
    expect(screen.getByText(/ana@correo\.pe/)).toBeInTheDocument();
  });

  it("explains the delivery estimate and the backorder", () => {
    render(<OrderConfirmation {...PROPS} />);

    const delivery = screen.getByRole("region", { name: "Entrega" });
    expect(delivery).toHaveTextContent(PROPS.delivery.title);
    expect(delivery).toHaveTextContent(PROPS.delivery.detail);
    expect(delivery).toHaveTextContent("productos en importación");
  });

  it("lists the next steps in order", () => {
    render(<OrderConfirmation {...PROPS} />);

    const steps = screen.getByRole("region", { name: "Próximos pasos" });
    expect(
      within(steps)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(PROPS.nextSteps);
  });

  it("shows the receipt, address and order summary", () => {
    render(<OrderConfirmation {...PROPS} />);

    expect(screen.getByText(PROPS.receipt)).toBeInTheDocument();
    expect(screen.getByText("Cayma, Arequipa, Arequipa")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Resumen del pedido" }),
    ).toHaveTextContent("Nano Charger 45W Smart Display");
  });

  it("links to tracking and back to the store", () => {
    render(<OrderConfirmation {...PROPS} />);

    expect(
      screen.getByRole("link", { name: "Seguir mi pedido" }),
    ).toHaveAttribute("href", PROPS.trackingHref);
    expect(
      screen.getByRole("link", { name: "Seguir comprando" }),
    ).toHaveAttribute("href", "/");
  });

  it("has no axe violations, with and without a backorder", async () => {
    const { container, rerender } = render(<OrderConfirmation {...PROPS} />);
    await expectNoAxeViolations(container);

    rerender(<OrderConfirmation {...PROPS} backorderNote={undefined} />);
    expect(screen.queryByText(/importación: lo enviamos/)).toBeNull();
    await expectNoAxeViolations(container);
  });
});
