// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import {
  aContact,
  anArequipaContact,
  BOLETA,
} from "@/modules/checkout/testing/checkout-builders";
import {
  advanceOrder,
  createOrder,
  currentStatus,
  formatOrderNumber,
  initialTimeline,
  normalizeOrderNumber,
  ORDER_NUMBER_PATTERN,
  orderSchema,
  payOrder,
  prepareOrder,
} from "./order";

const PLACED_AT = new Date("2026-10-02T15:00:00Z"); // Friday, 10:00 in Lima
const TOKEN = "0b9f4f7e-3c1a-4d2b-9e8f-7a6b5c4d3e2f";

function newOrder(overrides: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return createOrder({
    number: "MG-2026-000123",
    accessToken: TOKEN,
    placedAt: PLACED_AT,
    contact: aContact(),
    receipt: BOLETA,
    lines: [aLine({ quantity: 2 })],
    payment: { provider: "demo", chargeId: "chr_demo_1" },
    ...overrides,
  });
}

describe("order numbers", () => {
  it("formats MG-<year>-<6 digits>", () => {
    expect(formatOrderNumber(2026, 123)).toBe("MG-2026-000123");
    expect(formatOrderNumber(2026, 999999)).toBe("MG-2026-999999");
    expect(ORDER_NUMBER_PATTERN.test("MG-2026-000123")).toBe(true);
  });

  it("throws for a sequence outside 0–999999 or a year that is not 4 digits", () => {
    expect(() => formatOrderNumber(2026, 1_000_000)).toThrow(RangeError);
    expect(() => formatOrderNumber(2026, -1)).toThrow(RangeError);
    expect(() => formatOrderNumber(2026, 1.5)).toThrow(RangeError);
    expect(() => formatOrderNumber(999, 1)).toThrow(RangeError);
  });

  it("normalizes what a customer types", () => {
    expect(normalizeOrderNumber("  mg-2026-000123 ")).toBe("MG-2026-000123");
  });

  it("accepts spaces instead of dashes, inner spaces and no dashes at all", () => {
    expect(normalizeOrderNumber("mg 2026 000123")).toBe("MG-2026-000123");
    expect(normalizeOrderNumber("MG-2026 - 000 123")).toBe("MG-2026-000123");
    expect(normalizeOrderNumber("mg2026000123")).toBe("MG-2026-000123");
  });

  it("keeps anything else invalid (without spaces, uppercased)", () => {
    expect(normalizeOrderNumber("mg-2026-1")).toBe("MG-2026-1");
    expect(normalizeOrderNumber("  ")).toBe("");
    expect(ORDER_NUMBER_PATTERN.test(normalizeOrderNumber("2026000123"))).toBe(
      false,
    );
  });
});

describe("initialTimeline", () => {
  it("is paid at placement, then preparing, on its way and delivered", () => {
    expect(
      initialTimeline({ hasBackorder: false, placedAt: PLACED_AT }),
    ).toEqual([
      { status: "pagado", at: "2026-10-02T15:00:00.000Z" },
      { status: "preparando", at: null },
      { status: "en_camino", at: null },
      { status: "entregado", at: null },
    ]);
  });

  it("starts the import at placement when a line is on backorder", () => {
    expect(
      initialTimeline({ hasBackorder: true, placedAt: PLACED_AT }).slice(0, 3),
    ).toEqual([
      { status: "pagado", at: "2026-10-02T15:00:00.000Z" },
      { status: "en_importacion", at: "2026-10-02T15:00:00.000Z" },
      { status: "preparando", at: null },
    ]);
  });
});

describe("createOrder", () => {
  it("snapshots the lines and totals in céntimos with Lima shipping", () => {
    const order = newOrder();

    expect(order.lines).toEqual([
      {
        sku: "ANK-A2688",
        quantity: 2,
        unitPrice: 18990,
        lineTotal: 37980,
        availability: { status: "in_stock" },
        product: aLine().product,
      },
    ]);
    expect(order.totals).toEqual({
      subtotal: 37980,
      shipping: 1000,
      total: 38980,
    });
    expect(order.shipping).toEqual({
      zone: "lima_metro",
      transitDays: { min: 1, max: 2 },
      leadTimeDays: null,
      deliveryDays: { min: 1, max: 2 },
    });
    // Friday + 1–2 business days.
    expect(order.estimatedDelivery).toEqual({
      from: "2026-10-05",
      to: "2026-10-06",
    });
    expect(order.placedAt).toBe("2026-10-02T15:00:00.000Z");
    expect(currentStatus(order)).toBe("pagado");
  });

  it("keeps the customer, receipt, address and payment reference", () => {
    const order = newOrder();
    expect(order.customer).toEqual(aContact().customer);
    expect(order.shippingAddress).toEqual(aContact().address);
    expect(order.receipt).toEqual(BOLETA);
    expect(order.payment).toEqual({ provider: "demo", chargeId: "chr_demo_1" });
    expect(order.accessToken).toBe(TOKEN);
  });

  it("adds the backorder lead time to the delivery estimate and is 'en importación'", () => {
    const order = newOrder({
      contact: anArequipaContact(),
      lines: [aLine({}, aBackorderOffer())],
    });

    expect(order.totals).toEqual({
      subtotal: 24890,
      shipping: 2000,
      total: 26890,
    });
    expect(order.shipping.leadTimeDays).toEqual({ min: 15, max: 20 });
    expect(order.shipping.deliveryDays).toEqual({ min: 18, max: 25 });
    // Friday 2026-10-02 + 18 and + 25 business days.
    expect(order.estimatedDelivery).toEqual({
      from: "2026-10-28",
      to: "2026-11-06",
    });
    expect(currentStatus(order)).toBe("en_importacion");
  });

  it("throws for an order without lines", () => {
    expect(() => newOrder({ lines: [] })).toThrow();
  });

  it("produces data the schema accepts", () => {
    expect(orderSchema.parse(newOrder())).toEqual(newOrder());
  });
});

describe("prepareOrder and payOrder", () => {
  const input = {
    number: "MG-2026-000123",
    accessToken: TOKEN,
    placedAt: PLACED_AT,
    contact: aContact(),
    receipt: BOLETA,
    lines: [aLine({ quantity: 2 })],
  };
  const PAYMENT = { provider: "demo", chargeId: "chr_demo_1" } as const;

  it("checks the whole order before payment, then adds the payment reference", () => {
    const prepared = prepareOrder(input);

    expect(prepared).not.toHaveProperty("payment");
    expect(prepared.totals.total).toBe(38980);
    expect(payOrder(prepared, PAYMENT)).toEqual(newOrder());
  });

  it("throws before payment for an order that could never be stored", () => {
    expect(() => prepareOrder({ ...input, lines: [] })).toThrow();
    expect(() => prepareOrder({ ...input, accessToken: "nope" })).toThrow();
    expect(() => prepareOrder({ ...input, number: "MG-1" })).toThrow();
  });

  it("refuses a payment without a reference", () => {
    expect(() =>
      payOrder(prepareOrder(input), { provider: "demo", chargeId: "" }),
    ).toThrow();
  });
});

describe("orderSchema", () => {
  it("rejects totals that do not add up", () => {
    const order = newOrder();
    expect(
      orderSchema.safeParse({
        ...order,
        totals: { ...order.totals, total: order.totals.total + 1 },
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        ...order,
        totals: { ...order.totals, subtotal: 1, total: 1001 },
      }).success,
    ).toBe(false);
  });

  it("rejects a line total that is not unit price × quantity", () => {
    const order = newOrder();
    const [line] = order.lines;
    expect(
      orderSchema.safeParse({
        ...order,
        lines: [{ ...line, lineTotal: 1 }],
      }).success,
    ).toBe(false);
  });

  const AT = "2026-10-02T15:00:00.000Z";
  const LATER = "2026-10-03T15:00:00.000Z";

  it("accepts a timeline whose reached statuses come first, in order", () => {
    const order = newOrder();
    expect(
      orderSchema.safeParse({
        ...order,
        timeline: [
          { status: "pagado", at: AT },
          { status: "preparando", at: AT },
          { status: "en_camino", at: LATER },
          { status: "entregado", at: null },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects a timeline with statuses missing, repeated or out of order", () => {
    const order = newOrder();
    const timelines = [
      [
        { status: "pagado", at: AT },
        { status: "en_camino", at: null },
        { status: "entregado", at: null },
      ],
      [
        { status: "pagado", at: AT },
        { status: "preparando", at: null },
        { status: "preparando", at: null },
        { status: "en_camino", at: null },
        { status: "entregado", at: null },
      ],
      [
        { status: "pagado", at: AT },
        { status: "en_camino", at: null },
        { status: "preparando", at: null },
        { status: "entregado", at: null },
      ],
    ];
    for (const timeline of timelines) {
      expect(orderSchema.safeParse({ ...order, timeline }).success).toBe(false);
    }
  });

  it("has 'en importación' exactly when a line is on backorder", () => {
    const inStock = newOrder();
    expect(
      orderSchema.safeParse({
        ...inStock,
        timeline: initialTimeline({ hasBackorder: true, placedAt: PLACED_AT }),
      }).success,
    ).toBe(false);

    const backorder = newOrder({
      contact: anArequipaContact(),
      lines: [aLine({}, aBackorderOffer())],
    });
    expect(
      orderSchema.safeParse({
        ...backorder,
        timeline: initialTimeline({ hasBackorder: false, placedAt: PLACED_AT }),
      }).success,
    ).toBe(false);
  });

  it("rejects a reached status after a pending one, or dates going back", () => {
    const order = newOrder();
    expect(
      orderSchema.safeParse({
        ...order,
        timeline: [
          { status: "pagado", at: AT },
          { status: "preparando", at: null },
          { status: "en_camino", at: LATER },
          { status: "entregado", at: null },
        ],
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        ...order,
        timeline: [
          { status: "pagado", at: LATER },
          { status: "preparando", at: AT },
          { status: "en_camino", at: null },
          { status: "entregado", at: null },
        ],
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        ...order,
        timeline: [
          { status: "pagado", at: null },
          { status: "preparando", at: null },
          { status: "en_camino", at: null },
          { status: "entregado", at: null },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("advanceOrder", () => {
  it("reaches the next status at the given time, without changing the input", () => {
    const order = newOrder();
    const at = new Date("2026-10-02T18:30:00Z");

    const preparing = advanceOrder(order, at);

    expect(currentStatus(preparing)).toBe("preparando");
    expect(preparing.timeline[1]).toEqual({
      status: "preparando",
      at: "2026-10-02T18:30:00.000Z",
    });
    expect(currentStatus(order)).toBe("pagado");
  });

  it("goes from 'en importación' to preparing and on until delivered", () => {
    let order = newOrder({
      contact: anArequipaContact(),
      lines: [aLine({}, aBackorderOffer())],
    });
    const statuses = [];
    for (let day = 1; day <= 3; day += 1) {
      order = advanceOrder(order, new Date(Date.UTC(2026, 9, 2 + day * 10)));
      statuses.push(currentStatus(order));
    }
    expect(statuses).toEqual(["preparando", "en_camino", "entregado"]);
  });

  it("throws for a delivered order or a time before the last status", () => {
    let order = newOrder();
    for (let step = 1; step <= 3; step += 1) {
      order = advanceOrder(order, new Date(PLACED_AT.getTime() + step * 1000));
    }
    expect(() => advanceOrder(order, new Date("2026-10-20T00:00:00Z"))).toThrow(
      "already delivered",
    );
    expect(() =>
      advanceOrder(newOrder(), new Date("2026-10-01T00:00:00Z")),
    ).toThrow(RangeError);
  });
});
