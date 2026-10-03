// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import {
  aFactura,
  anArequipaContact,
} from "@/modules/checkout/testing/checkout-builders";
import { advanceOrder, type Order } from "@/modules/orders/domain/order";
import { anOrder } from "@/modules/orders/testing/order-builders";
import {
  maskEmail,
  maskStreet,
  orderTrackingView,
  recipientName,
} from "./order-tracking-view";
import { orderSummaryView } from "./order-view";

const PAID_AT = {
  label: "2 oct. 2026, 10:00 a. m.",
  dateTime: "2026-10-02T15:00:00.000Z",
};

function aBackorder(): Order {
  return anOrder({
    contact: anArequipaContact(),
    lines: [aLine({}, aBackorderOffer())],
  });
}

function advance(order: Order, ...isoDates: string[]): Order {
  return isoDates.reduce(
    (current, iso) => advanceOrder(current, new Date(iso)),
    order,
  );
}

describe("orderTrackingView", () => {
  it("shows a new in-stock order as paid, with the rest pending", () => {
    const order = anOrder();
    const view = orderTrackingView(order);

    expect(view.number).toBe("MG-2026-000123");
    expect(view.status).toBe("Pagado");
    expect(view.placedOn).toEqual({
      label: "2 de octubre de 2026",
      dateTime: "2026-10-02",
    });
    expect(view.steps).toEqual([
      {
        id: "pagado",
        label: "Pagado",
        description: "Confirmamos tu pago.",
        state: "current",
        reachedAt: PAID_AT,
      },
      {
        id: "preparando",
        label: "Preparando tu pedido",
        description: "Revisamos y empacamos tu pedido.",
        state: "pending",
      },
      {
        id: "en_camino",
        label: "En camino",
        description: "El courier lleva tu pedido a tu dirección.",
        state: "pending",
      },
      {
        id: "entregado",
        label: "Entregado",
        description: "Tu pedido llega a la dirección de entrega.",
        state: "pending",
      },
    ]);
    expect(view.delivery).toEqual({
      title: "Llega entre el lunes 5 de octubre y el martes 6 de octubre",
      detail: "Envío a Lima Metropolitana · 24–48 h (días hábiles)",
    });
    expect(view.importNote).toBeUndefined();
    expect(view.summary).toEqual(orderSummaryView(order));
  });

  it("hides most personal data on the public page", () => {
    const view = orderTrackingView(anOrder());

    expect(view.recipient).toBe("Ana P.");
    expect(view.shippingAddress).toEqual(["Av. La…", "Miraflores, Lima, Lima"]);
    expect(view.receipt).toBe("Boleta de venta electrónica");
    expect(view.updatesNote).toBe(
      "Te avisamos de cada cambio por correo a a•••@correo.pe.",
    );
    expect(JSON.stringify(view)).not.toContain("46027897");
    expect(JSON.stringify(view)).not.toContain("Larco");
    expect(JSON.stringify(view)).not.toContain("Frente al parque");
    expect(JSON.stringify(view)).not.toContain("987654321");
  });

  it("names only the receipt type of a factura", () => {
    expect(orderTrackingView(anOrder({ receipt: aFactura() })).receipt).toBe(
      "Factura electrónica",
    );
  });

  it("explains 'En importación' while the order is importing", () => {
    const view = orderTrackingView(aBackorder());

    expect(view.status).toBe("En importación");
    expect(view.steps.map((step) => [step.id, step.state])).toEqual([
      ["pagado", "done"],
      ["en_importacion", "current"],
      ["preparando", "pending"],
      ["en_camino", "pending"],
      ["entregado", "pending"],
    ]);
    expect(view.importNote).toEqual({
      title: "Tu pedido está en importación",
      paragraphs: [
        "Pedimos tus productos al proveedor especialmente para ti apenas confirmamos tu pago.",
        "La importación suele tomar 15–20 días hábiles y ya está incluida en la fecha estimada de entrega.",
        "Te escribiremos a tu correo en cada paso: cuando lleguen tus productos, cuando preparemos tu pedido y cuando salga a reparto.",
      ],
    });
    expect(view.summary.lines[0]?.availability).toEqual({
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    });
    expect(view.delivery.detail).toBe(
      "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)",
    );
  });

  it("says a backorder line arrived once the import is over", () => {
    const view = orderTrackingView(
      advance(aBackorder(), "2026-10-27T14:00:00Z"),
    );

    expect(view.status).toBe("Preparando tu pedido");
    expect(view.importNote).toBeUndefined();
    expect(view.summary.lines[0]?.availability).toEqual({
      status: "in_stock",
      label: "Llegó de importación",
    });
  });

  it("shows when a delivered order arrived", () => {
    const view = orderTrackingView(
      advance(
        anOrder(),
        "2026-10-02T18:00:00Z",
        "2026-10-05T13:00:00Z",
        "2026-10-05T21:30:00Z",
      ),
    );

    expect(view.status).toBe("Entregado");
    expect(view.steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "done",
      "current",
    ]);
    expect(view.steps[3]?.reachedAt).toEqual({
      label: "5 oct. 2026, 4:30 p. m.",
      dateTime: "2026-10-05T21:30:00.000Z",
    });
    expect(view.delivery).toEqual({
      title: "Entregado el lunes 5 de octubre",
      detail: "Envío a Lima Metropolitana",
    });
  });
});

describe("masking helpers", () => {
  it("keeps the first letter of an email's name", () => {
    expect(maskEmail("ana@correo.pe")).toBe("a•••@correo.pe");
    expect(maskEmail("x@y.pe")).toBe("x•••@y.pe");
  });

  it("keeps at most half of a street line, up to six characters", () => {
    expect(maskStreet("Calle Mercaderes 210")).toBe("Calle…");
    expect(maskStreet("Jr. 5")).toBe("Jr…");
  });

  it("uses the first name and the initial of the last name", () => {
    expect(recipientName({ firstName: "Ana", lastName: "Pérez Quispe" })).toBe(
      "Ana P.",
    );
  });
});
