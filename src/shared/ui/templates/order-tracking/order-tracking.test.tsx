import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  OrderTracking,
  type OrderTrackingProps,
  type TrackedOrder,
} from "./order-tracking";

const PAID = {
  label: "29 sept. 2026, 10:05 a. m.",
  dateTime: "2026-09-29T15:05:00.000Z",
};

const ORDER: TrackedOrder = {
  number: "MG-2026-480315",
  status: "En importación",
  placedOn: { label: "29 de septiembre de 2026", dateTime: "2026-09-29" },
  steps: [
    { id: "pagado", label: "Pagado", state: "done", reachedAt: PAID },
    {
      id: "en_importacion",
      label: "En importación",
      state: "current",
      reachedAt: PAID,
    },
    { id: "preparando", label: "Preparando tu pedido", state: "pending" },
    { id: "en_camino", label: "En camino", state: "pending" },
    { id: "entregado", label: "Entregado", state: "pending" },
  ],
  updatesNote: "Te avisamos de cada cambio a d•••@migeanje.pe.",
  delivery: {
    title: "Llega entre el lunes 26 de octubre y el miércoles 4 de noviembre",
    detail: "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)",
  },
  importNote: {
    title: "Tu pedido está en importación",
    paragraphs: [
      "Pedimos tus productos al proveedor especialmente para ti.",
      "Te escribiremos a tu correo en cada paso.",
    ],
  },
  recipient: "Lucía D.",
  shippingAddress: ["Calle…", "Cayma, Arequipa, Arequipa"],
  receipt: "Boleta de venta electrónica",
  summary: {
    lines: [
      {
        key: "UGR-15534",
        name: "Revodok Pro 210 Hub USB-C 10 en 1",
        quantity: 1,
        lineTotal: 19890,
        availability: {
          status: "backorder",
          label: "En importación · llega en 15–20 días",
        },
      },
    ],
    subtotal: 19890,
    shipping: 2000,
    shippingLabel: "Envío a Arequipa",
    total: 21890,
    notes: ["Precios incluyen impuestos."],
  },
};

const BASE: OrderTrackingProps = {
  intro: "Escribe tu número de pedido y tu correo.",
  helpLinks: [
    { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
    { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
  ],
};

describe("OrderTracking", () => {
  it("shows the lookup, its aside and the help links without an order", () => {
    render(
      <OrderTracking
        {...BASE}
        lookup={<form aria-label="Consulta" />}
        lookupAside={<p>Datos de demostración</p>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Seguimiento de pedido" }),
    ).toBeInTheDocument();
    expect(screen.getByText(BASE.intro)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Consulta" })).toBeInTheDocument();
    expect(screen.getByText("Datos de demostración")).toBeInTheDocument();
    const help = screen.getByRole("region", { name: "¿Necesitas ayuda?" });
    expect(
      within(help).getByRole("link", { name: "Libro de Reclamaciones" }),
    ).toHaveAttribute("href", "/libro-de-reclamaciones");
    expect(
      screen.queryByRole("region", { name: "Estado del pedido" }),
    ).toBeNull();
  });

  it("shows the order number in mono, its current status and the timeline", () => {
    render(<OrderTracking {...BASE} order={ORDER} />);

    expect(screen.getByText("MG-2026-480315")).toHaveClass("font-mono");
    expect(screen.getByText("29 de septiembre de 2026")).toHaveAttribute(
      "datetime",
      "2026-09-29",
    );
    const status = screen.getByRole("region", { name: "Estado del pedido" });
    expect(within(status).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(status)
        .getAllByRole("listitem")
        .find((item) => item.getAttribute("aria-current") === "step"),
    ).toHaveTextContent("En importación");
    expect(status).toHaveTextContent(ORDER.updatesNote as string);
    expect(screen.getByText(/Estado actual:/)).toHaveTextContent(
      "Estado actual: En importación",
    );
  });

  it("explains the delivery and the import", () => {
    render(<OrderTracking {...BASE} order={ORDER} />);

    const delivery = screen.getByRole("region", { name: "Entrega" });
    expect(delivery).toHaveTextContent(ORDER.delivery.title);
    expect(delivery).toHaveTextContent(ORDER.delivery.detail);
    expect(
      within(delivery).getByRole("heading", {
        level: 3,
        name: "Tu pedido está en importación",
      }),
    ).toBeInTheDocument();
    expect(delivery).toHaveTextContent("Te escribiremos a tu correo");
  });

  it("shows the recipient, partial address, receipt and summary", () => {
    render(<OrderTracking {...BASE} order={ORDER} />);

    const data = screen.getByRole("region", { name: "Datos del pedido" });
    expect(data).toHaveTextContent("Lucía D.");
    expect(data).toHaveTextContent("Cayma, Arequipa, Arequipa");
    expect(data).toHaveTextContent("Boleta de venta electrónica");
    expect(
      screen.getByRole("region", { name: "Resumen del pedido" }),
    ).toHaveTextContent("Revodok Pro 210");
  });

  it("renders the order actions instead of the lookup", () => {
    render(
      <OrderTracking
        {...BASE}
        order={ORDER}
        lookup={<form aria-label="Consulta" />}
        orderActions={<button type="button">Consultar otro pedido</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Consultar otro pedido" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Consulta" })).toBeNull();
  });

  it("has no axe violations: lookup, importing and without the import note", async () => {
    const { container, rerender } = render(
      <OrderTracking {...BASE} lookup={<p>Formulario</p>} />,
    );
    await expectNoAxeViolations(container);

    rerender(<OrderTracking {...BASE} order={ORDER} />);
    await expectNoAxeViolations(container);

    rerender(
      <OrderTracking
        {...BASE}
        order={{ ...ORDER, importNote: undefined, updatesNote: undefined }}
      />,
    );
    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    await expectNoAxeViolations(container);
  });
});
