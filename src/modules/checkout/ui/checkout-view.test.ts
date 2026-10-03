// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import { quoteShipping } from "@/modules/checkout/domain/shipping";
import {
  aContact,
  anArequipaContact,
  aUbigeoTree,
  BOLETA,
} from "@/modules/checkout/testing/checkout-builders";
import {
  checkoutSteps,
  contactFormDefaults,
  deliveryEstimateText,
  orderSummaryView,
  receiptFormDefaults,
  shippingLabel,
  ubigeoOptions,
} from "./checkout-view";

describe("checkoutSteps", () => {
  it("marks earlier steps complete with links, the current one and the rest upcoming", () => {
    expect(checkoutSteps("receipt")).toEqual([
      {
        id: "contact",
        label: "Contacto y envío",
        href: "/checkout/contacto",
        state: "complete",
      },
      {
        id: "receipt",
        label: "Comprobante",
        href: "/checkout/comprobante",
        state: "current",
      },
      {
        id: "payment",
        label: "Pago",
        href: "/checkout/pago",
        state: "upcoming",
      },
    ]);
  });
});

describe("shippingLabel", () => {
  it("names the zone or the departamento", () => {
    expect(shippingLabel("lima_metro", "Lima")).toBe(
      "Envío a Lima Metropolitana",
    );
    expect(shippingLabel("callao", "Callao")).toBe("Envío al Callao");
    expect(shippingLabel("rest_of_peru", "Arequipa")).toBe("Envío a Arequipa");
  });
});

describe("deliveryEstimateText", () => {
  it("gives 24–48 h in Lima and Callao and business days elsewhere", () => {
    expect(
      deliveryEstimateText(
        quoteShipping({ departamento: "15", provincia: "1501" }, null),
      ),
    ).toBe("Entrega en 24–48 h (días hábiles).");
    expect(
      deliveryEstimateText(
        quoteShipping({ departamento: "04", provincia: "0401" }, null),
      ),
    ).toBe("Entrega en 3–5 días hábiles.");
  });

  it("adds the import time of a backorder", () => {
    expect(
      deliveryEstimateText(
        quoteShipping(
          { departamento: "04", provincia: "0401" },
          {
            min: 15,
            max: 20,
          },
        ),
      ),
    ).toBe(
      "Entrega en 18–25 días hábiles: 15–20 de importación y 3–5 de envío.",
    );
  });
});

describe("orderSummaryView", () => {
  it("lists the lines with availability and totals before the address", () => {
    const view = orderSummaryView([aLine({ quantity: 2 })], null);
    expect(view).toEqual({
      lines: [
        {
          key: "ANK-A2688",
          name: "Prime Charger 100W, 3 puertos",
          variantLabel: undefined,
          quantity: 2,
          lineTotal: 37980,
          availability: { status: "in_stock", label: "En stock" },
        },
      ],
      subtotal: 37980,
      shipping: null,
      shippingLabel: undefined,
      total: null,
      notes: ["Precios incluyen impuestos."],
    });
  });

  it("adds shipping, the delivery estimate and the backorder note with an address", () => {
    const view = orderSummaryView(
      [aLine(), aLine({}, aBackorderOffer())],
      anArequipaContact().address.ubigeo,
    );
    expect(view.shipping).toBe(2000);
    expect(view.shippingLabel).toBe("Envío a Arequipa");
    expect(view.total).toBe(18990 + 24890 + 2000);
    expect(view.lines[1]).toMatchObject({
      variantLabel: "Blanco",
      availability: {
        status: "backorder",
        label: "En importación · llega en 15–20 días",
      },
    });
    expect(view.notes).toEqual([
      "Precios incluyen impuestos.",
      "Entrega en 18–25 días hábiles: 15–20 de importación y 3–5 de envío.",
      "Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en 15–20 días.",
    ]);
  });

  it("has no backorder note for an in-stock order to Lima", () => {
    const view = orderSummaryView([aLine()], aContact().address.ubigeo);
    expect(view.total).toBe(19990);
    expect(view.shippingLabel).toBe("Envío a Lima Metropolitana");
    expect(view.notes).toEqual([
      "Precios incluyen impuestos.",
      "Entrega en 24–48 h (días hábiles).",
    ]);
  });
});

describe("ubigeoOptions", () => {
  it("sorts places by name and filters children by the selected codes", () => {
    expect(
      ubigeoOptions(aUbigeoTree(), { departamento: "15", provincia: "1501" }),
    ).toEqual({
      departamentos: [
        { code: "04", name: "Arequipa" },
        { code: "07", name: "Callao" },
        { code: "15", name: "Lima" },
      ],
      provincias: [
        { code: "1505", name: "Cañete" },
        { code: "1501", name: "Lima" },
      ],
      distritos: [
        { code: "150101", name: "Lima" },
        { code: "150122", name: "Miraflores" },
      ],
    });
  });

  it("offers no distritos for a provincia of another departamento", () => {
    expect(
      ubigeoOptions(aUbigeoTree(), { departamento: "04", provincia: "1501" })
        .distritos,
    ).toEqual([]);
  });
});

describe("form defaults", () => {
  it("are empty for a new draft", () => {
    expect(contactFormDefaults(null)).toEqual({
      email: "",
      firstName: "",
      lastName: "",
      documentType: "dni",
      documentNumber: "",
      phone: "",
      addressLine: "",
      addressReference: "",
      departamento: "",
      provincia: "",
      distrito: "",
    });
    expect(receiptFormDefaults(null)).toEqual({
      receiptType: "boleta",
      ruc: "",
      businessName: "",
      fiscalAddress: "",
    });
  });

  it("come from the saved draft", () => {
    expect(contactFormDefaults(aContact())).toEqual({
      email: "ana@correo.pe",
      firstName: "Ana",
      lastName: "Pérez Quispe",
      documentType: "dni",
      documentNumber: "46027897",
      phone: "987654321",
      addressLine: "Av. Larco 1234, dpto. 501",
      addressReference: "Frente al parque",
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
    });
    expect(receiptFormDefaults(BOLETA)).toMatchObject({
      receiptType: "boleta",
    });
  });
});
