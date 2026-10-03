// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import {
  aFactura,
  anArequipaContact,
} from "@/modules/checkout/testing/checkout-builders";
import { anOrder } from "@/modules/orders/testing/order-builders";
import {
  deliveryDateText,
  orderConfirmationView,
  receiptText,
} from "./order-view";

describe("deliveryDateText", () => {
  it("names one day or a range of days in Spanish", () => {
    expect(deliveryDateText({ from: "2026-10-05", to: "2026-10-05" })).toBe(
      "Llega el lunes 5 de octubre",
    );
    expect(deliveryDateText({ from: "2026-10-28", to: "2026-11-06" })).toBe(
      "Llega entre el miércoles 28 de octubre y el viernes 6 de noviembre",
    );
  });
});

describe("receiptText", () => {
  it("describes a boleta with the customer's document", () => {
    const order = anOrder();
    expect(receiptText(order.receipt, order.customer.document)).toBe(
      "Boleta de venta electrónica · DNI 46027897",
    );
    expect(
      receiptText({ type: "boleta" }, { type: "ce", number: "001234567" }),
    ).toBe("Boleta de venta electrónica · CE 001234567");
  });

  it("describes a factura with the RUC and razón social", () => {
    expect(receiptText(aFactura(), { type: "dni", number: "46027897" })).toBe(
      "Factura electrónica · RUC 20131312955 · Empresa Demo S.A.C.",
    );
  });
});

describe("orderConfirmationView", () => {
  it("shows an in-stock order to Lima", () => {
    const view = orderConfirmationView(anOrder());

    expect(view).toMatchObject({
      orderNumber: "MG-2026-000123",
      email: "ana@correo.pe",
      delivery: {
        title: "Llega entre el lunes 5 de octubre y el martes 6 de octubre",
        detail: "Envío a Lima Metropolitana · 24–48 h (días hábiles)",
      },
      backorderNote: undefined,
      receipt: "Boleta de venta electrónica · DNI 46027897",
      shippingAddress: [
        "Av. Larco 1234, dpto. 501",
        "Referencia: Frente al parque",
        "Miraflores, Lima, Lima",
      ],
      trackingHref: "/pedidos/seguimiento?numero=MG-2026-000123",
      continueHref: "/",
    });
    expect(view.nextSteps).toHaveLength(3);
    expect(view.summary).toMatchObject({
      subtotal: 37980,
      shipping: 1000,
      shippingLabel: "Envío a Lima Metropolitana",
      total: 38980,
      notes: ["Precios incluyen impuestos."],
    });
    expect(view.summary.lines).toEqual([
      {
        key: "ANK-A2688",
        name: "Prime Charger 100W, 3 puertos",
        variantLabel: undefined,
        quantity: 2,
        lineTotal: 37980,
        availability: { status: "in_stock", label: "En stock" },
      },
    ]);
  });

  it("explains the import of a backorder to Arequipa", () => {
    const view = orderConfirmationView(
      anOrder({
        contact: anArequipaContact(),
        lines: [aLine({}, aBackorderOffer())],
      }),
    );

    expect(view.delivery).toEqual({
      title:
        "Llega entre el miércoles 28 de octubre y el viernes 6 de noviembre",
      detail: "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)",
    });
    expect(view.backorderNote).toBe(
      "Tu pedido incluye productos en importación: los pedimos al proveedor apenas confirmamos tu pago y llegan en 15–20 días hábiles. Te lo enviamos completo cuando todo esté disponible; puedes seguir cada paso con tu número de pedido.",
    );
    expect(view.nextSteps[1]).toBe(
      "Cuando lleguen tus productos en importación, preparamos tu pedido completo.",
    );
    expect(view.shippingAddress).toEqual([
      "Calle Mercaderes 210",
      "Cayma, Arequipa, Arequipa",
    ]);
  });
});
