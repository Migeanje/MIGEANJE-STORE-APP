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
import type {
  CheckoutDraft,
  ContactDetails,
} from "@/modules/checkout/domain/checkout-draft";
import { paymentQuote } from "@/modules/checkout/domain/payment-quote";
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
  anOrder,
  fakeOrders,
  fakePayments,
  fakeReconciliations,
  PLACED_AT,
} from "@/modules/orders/testing/order-builders";
import { placeOrder } from "./place-order";

function setup({
  cart = aCart([aLine({ quantity: 2 })]),
  offers = [anOffer(), aBackorderOffer()],
  payment = fakePayments(),
  reconciliations = fakeReconciliations(),
}: {
  cart?: Cart;
  offers?: CartOffer[];
  payment?: ReturnType<typeof fakePayments>;
  reconciliations?: ReturnType<typeof fakeReconciliations>;
} = {}) {
  const carts = fakeCarts([cart]);
  const orders = fakeOrders();
  const services = {
    orders: orders.repository,
    payments: payment.gateway,
    products: fakeProducts(offers),
    carts: carts.repository,
    reconciliations: reconciliations.log,
    now: () => PLACED_AT,
    newAccessToken: () => ACCESS_TOKEN,
  };
  return { services, carts, orders, payment, reconciliations, cart };
}

const DRAFT: CheckoutDraft = {
  cartId: CART_ID,
  contact: aContact(),
  receipt: BOLETA,
};

/** What the payment page showed for this cart and address ("Pagar S/ X"). */
function quoteOf(cart: Cart, contact: ContactDetails = aContact()) {
  const { ubigeo } = contact.address;
  const quote = paymentQuote(cart.lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  if (!quote) throw new Error("A contact always has a shipping quote");
  return quote;
}

describe("placeOrder", () => {
  it("charges subtotal plus shipping, stores the order and empties the cart", async () => {
    const { services, carts, orders, payment, cart } = setup();

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
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
    expect(result.cartCleared).toBe(true);
  });

  it("never stores card data in the order", async () => {
    const { services, cart } = setup();
    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
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
      expected: quoteOf(cart, anArequipaContact()),
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
      expected: quoteOf(cart),
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
      expected: quoteOf(cart),
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
      expected: quoteOf(cart),
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

  it("does not charge a payment page that shows an old total (the cart changed in another tab)", async () => {
    // The page said "Pagar S/ 199.90" for one charger; then 2 more were added.
    const shown = quoteOf(aCart([aLine({ quantity: 1 })]));
    const { services, carts, orders, payment, cart } = setup({
      cart: aCart([aLine({ quantity: 3 })]),
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: shown,
      facturaEnabled: false,
    });

    expect(shown.total).toBe(19990);
    expect(result).toEqual({
      ok: false,
      error: {
        code: "cart_changed",
        changes: [{ kind: "quote", from: 19990, to: 57970 }],
      },
    });
    expect(payment.requests).toEqual([]);
    expect(orders.store.size).toBe(0);
    expect(carts.store.get(CART_ID)?.lines[0]?.quantity).toBe(3);
  });

  it("never charges an amount from the form: a lower posted total is refused", async () => {
    const { services, payment, cart } = setup();
    const current = quoteOf(cart);

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: { ...current, total: 100 },
      facturaEnabled: false,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "cart_changed",
        changes: [{ kind: "quote", from: 100, to: 38980 }],
      },
    });
    expect(payment.requests).toEqual([]);
  });

  it("does not charge when the cart changed but its total did not, or no quote came", async () => {
    const { services, payment, cart } = setup();
    const current = quoteOf(cart);

    for (const expected of [{ ...current, fingerprint: "00000000" }, null]) {
      const result = await placeOrder(services, {
        cart,
        draft: DRAFT,
        card: aCard(),
        expected,
        facturaEnabled: false,
      });
      expect(result).toEqual({
        ok: false,
        error: {
          code: "cart_changed",
          changes: [
            { kind: "quote", from: expected?.total ?? null, to: 38980 },
          ],
        },
      });
    }
    expect(payment.requests).toEqual([]);
  });

  it("checks the order before charging: an order that cannot be built is never charged", async () => {
    const { services, orders, payment, cart } = setup();
    services.newAccessToken = () => "not-a-uuid";

    await expect(
      placeOrder(services, {
        cart,
        draft: DRAFT,
        card: aCard(),
        expected: quoteOf(cart),
        facturaEnabled: false,
      }),
    ).rejects.toThrow();
    expect(payment.requests).toEqual([]);
    expect(orders.store.size).toBe(0);
  });

  it("never charges when no order number can be reserved", async () => {
    const { services, payment, cart } = setup();
    services.orders = {
      ...services.orders,
      reserveNumber: async () => {
        throw new Error("No free order number for 2026");
      },
    };

    await expect(
      placeOrder(services, {
        cart,
        draft: DRAFT,
        card: aCard(),
        expected: quoteOf(cart),
        facturaEnabled: false,
      }),
    ).rejects.toThrow("No free order number");
    expect(payment.requests).toEqual([]);
  });

  it("keeps a record to reconcile when the order cannot be stored after the charge", async () => {
    const { services, carts, payment, reconciliations, cart } = setup();
    services.orders = {
      ...services.orders,
      save: async () => {
        throw new Error("disk full");
      },
    };

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "order_persist_failed_after_charge",
        orderNumber: "MG-2026-000001",
        chargeId: "chr_demo_1",
        amount: 38980,
        failure: "disk full",
        recorded: true,
      },
    });
    expect(payment.requests).toHaveLength(1);
    expect(reconciliations.entries).toEqual([
      {
        order: expect.objectContaining({
          number: "MG-2026-000001",
          totals: { subtotal: 37980, shipping: 1000, total: 38980 },
        }),
        chargeId: "chr_demo_1",
        amount: 38980,
        currency: "PEN",
        cartId: CART_ID,
        failure: "disk full",
        recordedAt: PLACED_AT.toISOString(),
      },
    ]);
    // Never card data in the record.
    const recorded = JSON.stringify(reconciliations.entries);
    expect(recorded).not.toContain("4111111111111111");
    expect(recorded).not.toContain("ANA PEREZ");
    // The cart stays as it was (the record holds what was bought).
    expect(carts.store.get(CART_ID)?.lines).toHaveLength(1);
  });

  it("also keeps a record when the approved charge has no usable reference", async () => {
    const { services, orders, reconciliations, cart } = setup({
      payment: fakePayments({ status: "approved", chargeId: "" }),
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "order_persist_failed_after_charge",
      orderNumber: "MG-2026-000001",
      chargeId: "",
      recorded: true,
    });
    expect(reconciliations.entries).toHaveLength(1);
    expect(orders.store.size).toBe(0);
  });

  it("still says the payment was registered when the record fails too", async () => {
    const { services, cart } = setup({
      reconciliations: fakeReconciliations({
        failure: new Error("log unavailable"),
      }),
    });
    services.orders = {
      ...services.orders,
      save: async () => {
        throw new Error("disk full");
      },
    };

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatchObject({
      code: "order_persist_failed_after_charge",
      recorded: false,
    });
  });

  it("never charges again a cart whose payment awaits reconciliation", async () => {
    const { services, orders, payment, cart } = setup();
    const save = services.orders.save;
    services.orders = {
      ...services.orders,
      save: async () => {
        throw new Error("disk full");
      },
    };
    const input = {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    };
    const first = await placeOrder(services, input);
    expect(first.ok).toBe(false);

    // The store works again, the page is the same: still no second charge.
    services.orders = { ...services.orders, save };
    const second = await placeOrder(services, input);

    expect(second).toEqual({
      ok: false,
      error: {
        code: "payment_pending_reconciliation",
        orderNumber: "MG-2026-000001",
      },
    });
    expect(payment.requests).toHaveLength(1);
    expect(orders.store.size).toBe(0);
  });

  it("charges other carts while one awaits reconciliation", async () => {
    const reconciliations = fakeReconciliations();
    const { services, cart } = setup({ reconciliations });
    const { payment: _payment, ...other } = anOrder({
      number: "MG-2026-999999",
    });
    await reconciliations.log.record({
      order: other,
      chargeId: "chr_demo_0",
      amount: other.totals.total,
      currency: "PEN",
      cartId: "00000000-0000-4000-8000-000000000000",
      failure: "disk full",
      recordedAt: PLACED_AT.toISOString(),
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    });

    expect(result.ok).toBe(true);
  });

  it("keeps a stored order when emptying the cart fails afterwards", async () => {
    const { services, orders, cart } = setup();
    services.carts = {
      ...services.carts,
      save: async () => {
        throw new Error("cart store down");
      },
    };

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard(),
      expected: quoteOf(cart),
      facturaEnabled: false,
    });

    expect(result).toEqual({
      ok: true,
      order: orders.store.get("MG-2026-000001"),
      cartCleared: false,
    });
  });

  it("keeps the cart and stores nothing when the card is declined", async () => {
    const { services, carts, orders, cart } = setup({
      payment: fakePayments({ status: "declined", reason: "card_declined" }),
    });

    const result = await placeOrder(services, {
      cart,
      draft: DRAFT,
      card: aCard({ number: "4000000000000002" }),
      expected: quoteOf(cart),
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
          expected: null,
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
          expected: quoteOf(cart),
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
      expected: quoteOf(cart),
      facturaEnabled: true,
    });
    expect(result.ok && result.order.receipt).toEqual(aFactura());
  });
});
