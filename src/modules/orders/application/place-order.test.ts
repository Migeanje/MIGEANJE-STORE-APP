// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Cart, CartOffer } from "@/modules/cart/domain/cart";
import {
  aBackorderOffer,
  aCart,
  aLine,
  anOffer,
  CART_ID,
  fakeCarts,
  fakeProducts,
} from "@/modules/cart/testing/cart-builders";
import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import {
  aContact,
  aFactura,
  anArequipaContact,
  BOLETA,
} from "@/modules/checkout/testing/checkout-builders";
import { currentStatus } from "@/modules/orders/domain/order";
import {
  ACCESS_TOKEN,
  aCard,
  fakeOrders,
  fakePayments,
  PLACED_AT,
} from "@/modules/orders/testing/order-builders";
import { placeOrder } from "./place-order";

function setup({
  cart = aCart([aLine({ quantity: 2 })]),
  offers = [anOffer(), aBackorderOffer()],
  payment = fakePayments(),
}: {
  cart?: Cart;
  offers?: CartOffer[];
  payment?: ReturnType<typeof fakePayments>;
} = {}) {
  const carts = fakeCarts([cart]);
  const orders = fakeOrders();
  const services = {
    orders: orders.repository,
    payments: payment.gateway,
    products: fakeProducts(offers),
    carts: carts.repository,
    now: () => PLACED_AT,
    newAccessToken: () => ACCESS_TOKEN,
  };
  return { services, carts, orders, payment, cart };
}

const DRAFT: CheckoutDraft = {
  cartId: CART_ID,
  contact: aContact(),
  receipt: BOLETA,
};

describe("placeOrder", () => {
  it("charges subtotal plus shipping, stores the order and empties the cart", async () => {
    const { services, carts, orders, payment, cart } = setup();

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(payment.requests).toEqual([
      {
        amount: 38980,
        currency: "PEN",
        email: "ana@correo.pe",
        description: "Migeanje Store · pedido MG-2026-000001",
        card: aCard(),
      },
    ]);
    expect(result.order).toMatchObject({
      number: "MG-2026-000001",
      accessToken: ACCESS_TOKEN,
      totals: { subtotal: 37980, shipping: 1000, total: 38980 },
      payment: { provider: "demo", chargeId: "chr_demo_1" },
    });
    expect(orders.store.get("MG-2026-000001")).toEqual(result.order);
    expect(carts.store.get(CART_ID)?.lines).toEqual([]);
  });

  it("never stores card data in the order", async () => {
    const { services, cart } = setup();
    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      facturaEnabled: false,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("4111111111111111");
    expect(serialized).not.toContain('"123"');
    expect(serialized).not.toContain("ANA PEREZ");
  });

  it("ships a backorder to Arequipa with its lead time and starts the import", async () => {
    const { services, cart } = setup({
      cart: aCart([aLine({}, aBackorderOffer())]),
    });
    const result = await placeOrder(services, {
      cart,
      draft: { ...DRAFT, contact: anArequipaContact() },
      card: aCard(),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.totals).toEqual({
      subtotal: 24890,
      shipping: 2000,
      total: 26890,
    });
    expect(result.order.shipping.deliveryDays).toEqual({ min: 18, max: 25 });
    expect(currentStatus(result.order)).toBe("en_importacion");
  });

  it("does not charge when a price changed: it refreshes the cart and asks to review", async () => {
    const { services, carts, orders, payment, cart } = setup({
      offers: [anOffer({ unitPrice: 19990 })],
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      facturaEnabled: false,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "cart_changed",
        changes: [
          {
            kind: "price",
            sku: "ANK-A2688",
            product: anOffer().product,
            from: 18990,
            to: 19990,
          },
        ],
      },
    });
    expect(payment.requests).toEqual([]);
    expect(orders.store.size).toBe(0);
    expect(carts.store.get(CART_ID)?.lines[0]?.unitPrice).toBe(19990);
  });

  it("does not charge when a product went on backorder or out of stock", async () => {
    const backorder = aBackorderOffer();
    const { services, carts, payment, cart } = setup({
      cart: aCart([aLine(), aLine({}, aBackorderOffer())]),
      offers: [
        anOffer({ availability: backorder.availability }),
        aBackorderOffer({ availability: { status: "unavailable" } }),
      ],
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual({
      code: "cart_changed",
      changes: [
        {
          kind: "availability",
          sku: "ANK-A2688",
          product: anOffer().product,
          from: { status: "in_stock" },
          to: backorder.availability,
        },
        {
          kind: "unavailable",
          sku: "ANK-A121D-WHT",
          product: aBackorderOffer().product,
        },
      ],
    });
    expect(payment.requests).toEqual([]);
    expect(carts.store.get(CART_ID)?.lines.map((line) => line.sku)).toEqual([
      "ANK-A2688",
    ]);
  });

  it("does not charge when a quantity no longer fits the line limit", async () => {
    const { services, payment, cart } = setup({
      cart: aCart([aLine({ quantity: 5 })]),
      offers: [anOffer({ stockLimit: 3 })],
    });
    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      facturaEnabled: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "cart_changed",
      changes: [{ kind: "quantity", sku: "ANK-A2688", from: 5, to: 3 }],
    });
    expect(payment.requests).toEqual([]);
  });

  it("keeps the cart and stores nothing when the card is declined", async () => {
    const { services, carts, orders, cart } = setup({
      payment: fakePayments({ status: "declined", reason: "card_declined" }),
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard({ number: "4000000000000002" }),
      facturaEnabled: false,
    });

    expect(result).toEqual({
      ok: false,
      error: { code: "payment_declined", reason: "card_declined" },
    });
    expect(orders.store.size).toBe(0);
    expect(carts.store.get(CART_ID)?.lines).toHaveLength(1);
  });

  it("refuses an empty or missing cart", async () => {
    const { services } = setup();
    for (const cart of [null, aCart([])]) {
      expect(
        await placeOrder(services, {
          cart,
          draft: DRAFT,
          card: aCard(),
          facturaEnabled: false,
        }),
      ).toEqual({ ok: false, error: { code: "empty_cart" } });
    }
  });

  it("refuses an incomplete checkout", async () => {
    const { services, payment, cart } = setup();
    const cases: [CheckoutDraft | null, "contact" | "receipt"][] = [
      [null, "contact"],
      [{ ...DRAFT, contact: null }, "contact"],
      [{ ...DRAFT, receipt: null }, "receipt"],
      // A factura while facturas are disabled.
      [{ ...DRAFT, receipt: aFactura() }, "receipt"],
      // The draft of another cart.
      [{ ...DRAFT, cartId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d" }, "contact"],
    ];
    for (const [draft, step] of cases) {
      expect(
        await placeOrder(services, {
          cart,
          draft,
          card: aCard(),
          facturaEnabled: false,
        }),
      ).toEqual({ ok: false, error: { code: "incomplete_checkout", step } });
    }
    expect(payment.requests).toEqual([]);
  });

  it("accepts a factura when facturas are enabled", async () => {
    const { services, cart } = setup();
    const result = await placeOrder(services, {
      cart,
      draft: { ...DRAFT, receipt: aFactura() },
      card: aCard(),
      facturaEnabled: true,
    });
    expect(result.ok && result.order.receipt).toEqual(aFactura());
  });
});
