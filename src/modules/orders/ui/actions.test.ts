// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { CART_COOKIE } from "@/modules/cart/infrastructure/cart-cookie";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import {
  type PaymentQuote,
  paymentQuote,
} from "@/modules/checkout/domain/payment-quote";
import { getCheckoutDraftRepository } from "@/modules/checkout/infrastructure";
import { aContact, BOLETA } from "@/modules/checkout/testing/checkout-builders";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import {
  getOrderRepository,
  getReconciliationLog,
} from "@/modules/orders/infrastructure";
import { CLIENT_ID_COOKIE } from "@/modules/orders/infrastructure/client-key";
import { ORDER_ACCESS_COOKIE } from "@/modules/orders/infrastructure/order-access-cookie";
import { anOrder } from "@/modules/orders/testing/order-builders";
import {
  placeOrderAction,
  trackAnotherOrderAction,
  trackOrderAction,
  unlockOrderAction,
} from "./actions";
import { trackingInitialState } from "./tracking-form";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
const setCookie = vi.fn((name: string, value: string) => jar.set(name, value));
const requestHeaders = new Headers();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: setCookie,
  }),
  headers: async () => requestHeaders,
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh: () => refresh() }));

const NBSP = " ";

const CARD = {
  cardNumber: "4111 1111 1111 1111",
  cardExpiry: "12/30",
  cardCvv: "123",
  cardHolder: "ANA PEREZ",
  acceptTerms: "si",
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

/** The hidden fields of the payment page that showed `quote`. */
function shown(quote: PaymentQuote) {
  return {
    expectedTotal: String(quote.total),
    quoteFingerprint: quote.fingerprint,
  };
}

/**
 * A cart with the real catalog price of the Prime Charger, a complete draft
 * (shipping to Lima) and what the payment page shows for them.
 */
async function readyToPay({
  lines = [aLine({ quantity: 2 })],
  receipt = BOLETA,
}: {
  lines?: ReturnType<typeof aLine>[];
  receipt?: typeof BOLETA | null;
} = {}) {
  const carts = getCartRepository();
  const cart = await carts.create();
  await carts.save({ ...cart, lines });
  jar.set(CART_COOKIE, cart.id);
  await getCheckoutDraftRepository().save({
    cartId: cart.id,
    contact: aContact(),
    receipt,
  });
  const quote = paymentQuote(lines, { departamento: "15", provincia: "1501" });
  if (!quote) throw new Error("Lima always has a shipping quote");
  return { cartId: cart.id, quote, pay: { ...CARD, ...shown(quote) } };
}

beforeEach(() => {
  jar.clear();
  setCookie.mockClear();
  refresh.mockClear();
  for (const name of [...requestHeaders.keys()]) requestHeaders.delete(name);
  // An empty jar: each test is a new browser (its own anonymous id) for the
  // process-wide limiter of order lookups.
});

/** Another browser: it has not got the anonymous id of this one. */
function anotherBrowser() {
  jar.delete(CLIENT_ID_COOKIE);
}

const TOO_MANY_ATTEMPTS = {
  title: "Demasiados intentos",
  message:
    "Por tu seguridad pausamos las consultas desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
};

describe("placeOrderAction", () => {
  it("pays, stores the order, empties the cart and opens the confirmation", async () => {
    const { cartId, pay } = await readyToPay();

    const error = await placeOrderAction(initialFormState(), form(pay)).catch(
      (thrown: Error) => thrown,
    );

    const match =
      /^NEXT_REDIRECT:\/checkout\/confirmacion\/(MG-\d{4}-\d{6})$/.exec(
        (error as Error).message,
      );
    expect(match).not.toBeNull();
    const number = match?.[1] as string;
    const order = await getOrderRepository().findByNumber(number);
    expect(order?.totals).toEqual({
      subtotal: 37980,
      shipping: 1000,
      total: 38980,
    });
    expect((await getCartRepository().get(cartId))?.lines).toEqual([]);
    expect(await getCheckoutDraftRepository().get(cartId)).toBeNull();
    expect(setCookie).toHaveBeenCalledWith(
      ORDER_ACCESS_COOKIE,
      `${number}.${order?.accessToken}`,
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });

  it("answers card errors without echoing card data", async () => {
    const { pay } = await readyToPay();

    const state = await placeOrderAction(
      initialFormState(),
      form({ ...pay, cardNumber: "4111 1111 1111 1112", acceptTerms: "" }),
    );

    expect(state).toEqual({
      values: { acceptTerms: "" },
      errors: {
        cardNumber: "Revisa el número de tu tarjeta.",
        acceptTerms: "Acepta los términos y condiciones para continuar.",
      },
      formError: null,
      attempt: 1,
    });
    expect(JSON.stringify(state)).not.toContain("4111");
  });

  it("explains a declined card and keeps the cart", async () => {
    const { cartId, pay } = await readyToPay();

    const state = await placeOrderAction(
      initialFormState(),
      form({ ...pay, cardNumber: "4000 0000 0000 0002" }),
    );

    expect(state.formError).toEqual({
      title: "No pudimos procesar el pago",
      message:
        "Tu banco rechazó la tarjeta. Prueba con otra tarjeta o comunícate con tu banco. No se hizo ningún cargo.",
    });
    expect(state.values).toEqual({ acceptTerms: "si" });
    expect((await getCartRepository().get(cartId))?.lines).toHaveLength(1);
    expect(JSON.stringify(state)).not.toContain("4000");
  });

  it("only charges the test cards in demo mode", async () => {
    const { pay } = await readyToPay();
    const state = await placeOrderAction(
      initialFormState(),
      form({ ...pay, cardNumber: "5555 5555 5555 4444" }),
    );
    expect(state.formError?.message).toContain("4111 1111 1111 1111");
  });

  it("asks to review a cart whose prices changed, without charging", async () => {
    // The cart remembers S/ 150.00 for a charger the catalog sells at S/ 189.90.
    const { cartId, pay } = await readyToPay({
      lines: [aLine({ unitPrice: 15000 })],
    });

    const state = await placeOrderAction(initialFormState(), form(pay));

    expect(state.formError).toEqual({
      title: "Tu carrito cambió",
      message:
        "Actualizamos tu pedido con los precios y la disponibilidad de hoy. Revisa el nuevo total antes de pagar: no se hizo ningún cargo.",
      details: [
        "Prime Charger 100W, 3 puertos: ahora cuesta S/ 189.90 (antes S/ 150.00).",
      ],
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect((await getCartRepository().get(cartId))?.lines[0]?.unitPrice).toBe(
      18990,
    );
  });

  it("explains a product that went on backorder", async () => {
    const { pay } = await readyToPay({
      // The cart thinks the Nano Charger is in stock.
      lines: [
        aLine(
          { maxQuantity: 5 },
          { ...aBackorderOffer(), availability: { status: "in_stock" } },
        ),
      ],
    });
    const state = await placeOrderAction(initialFormState(), form(pay));
    expect(state.formError?.details).toEqual([
      "Nano Charger 45W Smart Display (Blanco): ahora está en importación y llega en 15–20 días.",
    ]);
  });

  it("refuses a stale payment page (the cart changed in another tab) and shows the new total", async () => {
    // The page said "Pagar S/ 199.90"; another tab then added 2 chargers.
    const { cartId, pay } = await readyToPay({
      lines: [aLine({ quantity: 1 })],
    });
    await getCartRepository().save({
      id: cartId,
      lines: [aLine({ quantity: 3 })],
    });

    const state = await placeOrderAction(initialFormState(), form(pay));

    expect(state.formError).toEqual({
      title: "Tu carrito cambió",
      message: `Tu carrito cambió después de que abriste esta página, quizás en otra pestaña. Revisa tu pedido antes de pagar: el total ahora es S/${NBSP}579.70. No se hizo ningún cargo.`,
    });
    expect(state.values).toEqual({ acceptTerms: "si" });
    // The page re-renders with the fresh summary and "Pagar S/ 579.70".
    expect(refresh).toHaveBeenCalledTimes(1);
    expect((await getCartRepository().get(cartId))?.lines[0]?.quantity).toBe(3);
    expect(await getCheckoutDraftRepository().get(cartId)).not.toBeNull();
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("refuses a payment without the quote of the page", async () => {
    await readyToPay();
    const state = await placeOrderAction(initialFormState(), form(CARD));
    expect(state.formError?.title).toBe("Tu carrito cambió");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("says the payment was registered when the order cannot be stored after the charge, without inviting a retry", async () => {
    const { cartId, pay } = await readyToPay();
    const save = vi
      .spyOn(getOrderRepository(), "save")
      .mockRejectedValueOnce(new Error("disk full"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const state = await placeOrderAction(initialFormState(), form(pay));

      const number = /MG-\d{4}-\d{6}/.exec(state.formError?.message ?? "")?.[0];
      expect(number).toBeDefined();
      expect(state.formError).toEqual({
        title: "Registramos tu pago",
        message: `Recibimos tu pago, pero no pudimos terminar de registrar tu pedido. No vuelvas a pagar: revisaremos tu pago y te escribiremos a tu correo para confirmar tu pedido. Tu código de referencia es ${number}.`,
      });
      expect(state.formError?.message).not.toMatch(/inténtalo de nuevo/i);
      // The page re-renders without "Pagar" (pending reconciliation notice).
      expect(refresh).toHaveBeenCalledTimes(1);

      // One structured server event, without card or personal data.
      expect(log).toHaveBeenCalledTimes(1);
      const event = JSON.parse(log.mock.calls[0]?.[0] as string);
      expect(event).toEqual({
        event: "order_persist_failed_after_charge",
        orderNumber: number,
        chargeId: expect.stringMatching(/^chr_demo_/),
        amount: 38980,
        currency: "PEN",
        reconciliationRecorded: true,
        failure: "disk full",
      });
      const logged = JSON.stringify(log.mock.calls);
      expect(logged).not.toContain("4111");
      expect(logged).not.toContain("ana@correo.pe");

      const pending = await getReconciliationLog().list();
      expect(pending.at(-1)).toMatchObject({
        order: { number },
        chargeId: event.chargeId,
        amount: 38980,
        cartId,
      });
      expect(await getOrderRepository().findByNumber(number as string)).toBe(
        null,
      );
    } finally {
      save.mockRestore();
      log.mockRestore();
    }
  });

  it("never charges again after a registered payment: the next attempt is refused", async () => {
    const { cartId, pay } = await readyToPay();
    const orders = getOrderRepository();
    const save = vi
      .spyOn(orders, "save")
      .mockRejectedValueOnce(new Error("disk full"));
    const reserve = vi.spyOn(orders, "reserveNumber");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const first = await placeOrderAction(initialFormState(), form(pay));
      const number = /MG-\d{4}-\d{6}/.exec(first.formError?.message ?? "")?.[0];
      refresh.mockClear();

      // E.g. a second tab still showing "Pagar", or the back button.
      const second = await placeOrderAction(first, form(pay));

      expect(second.formError).toEqual({
        title: "Ya registramos un pago",
        message: `Ya registramos un pago para este carrito y lo estamos confirmando. No vuelvas a pagar; te escribiremos a tu correo. Tu código de referencia es ${number}.`,
      });
      expect(refresh).toHaveBeenCalledTimes(1);
      // Refused before reserving a number or charging.
      expect(reserve).toHaveBeenCalledTimes(1);
      expect(await orders.findByNumber(number as string)).toBeNull();
      expect(
        (await getReconciliationLog().list()).filter(
          (entry) => entry.cartId === cartId,
        ),
      ).toHaveLength(1);
      expect(setCookie).not.toHaveBeenCalledWith(
        ORDER_ACCESS_COOKIE,
        expect.anything(),
        expect.anything(),
      );
    } finally {
      save.mockRestore();
      reserve.mockRestore();
      log.mockRestore();
    }
  });

  it("opens the confirmation of a stored order even when emptying the cart fails", async () => {
    const { pay } = await readyToPay();
    const save = vi
      .spyOn(getCartRepository(), "save")
      .mockRejectedValueOnce(new Error("cart store down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const error = await placeOrderAction(initialFormState(), form(pay)).catch(
        (thrown: Error) => thrown,
      );

      const number =
        /^NEXT_REDIRECT:\/checkout\/confirmacion\/(MG-\d{4}-\d{6})$/.exec(
          (error as Error).message,
        )?.[1];
      expect(number).toBeDefined();
      expect(
        await getOrderRepository().findByNumber(number as string),
      ).not.toBe(null);
      expect(JSON.parse(log.mock.calls[0]?.[0] as string)).toEqual({
        event: "order_cart_not_cleared",
        orderNumber: number,
      });
    } finally {
      save.mockRestore();
      log.mockRestore();
    }
  });

  it("sends an empty cart to the cart page and an incomplete checkout to its step", async () => {
    await expect(
      placeOrderAction(initialFormState(), form(CARD)),
    ).rejects.toThrow("NEXT_REDIRECT:/carrito");

    await readyToPay({ receipt: null });
    await expect(
      placeOrderAction(initialFormState(), form(CARD)),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/comprobante");
  });
});

describe("unlockOrderAction", () => {
  it("opens the confirmation for the buyer's email", async () => {
    const order = anOrder({ number: "MG-2026-555001" });
    await getOrderRepository().save(order);

    await expect(
      unlockOrderAction(
        { message: null },
        form({ number: order.number, email: " ANA@correo.pe " }),
      ),
    ).rejects.toThrow(`NEXT_REDIRECT:/checkout/confirmacion/${order.number}`);
    expect(jar.get(ORDER_ACCESS_COOKIE)).toBe(
      `${order.number}.${order.accessToken}`,
    );
  });

  it("answers the same for another email or an unknown number", async () => {
    const order = anOrder({ number: "MG-2026-555002" });
    await getOrderRepository().save(order);

    const message = "No encontramos un pedido con ese número y correo.";
    expect(
      await unlockOrderAction(
        { message: null },
        form({ number: order.number, email: "otra@correo.pe" }),
      ),
    ).toEqual({ message });
    expect(
      await unlockOrderAction(
        { message: null },
        form({ number: "MG-2026-000000", email: "ana@correo.pe" }),
      ),
    ).toEqual({ message });
    expect(jar.has(ORDER_ACCESS_COOKIE)).toBe(false);
  });

  it("pauses a client after 10 failed lookups, counted together with tracking", async () => {
    const order = anOrder({ number: "MG-2026-555007" });
    await getOrderRepository().save(order);
    const wrong = form({ number: order.number, email: "otra@correo.pe" });
    let tracking = trackingInitialState(undefined);
    for (let failure = 0; failure < 5; failure += 1) {
      tracking = await trackOrderAction(tracking, wrong);
      await unlockOrderAction({ message: null }, wrong);
    }

    const right = form({ number: order.number, email: "ana@correo.pe" });
    expect(await unlockOrderAction({ message: null }, right)).toEqual({
      message: TOO_MANY_ATTEMPTS.message,
    });
    expect(jar.has(ORDER_ACCESS_COOKIE)).toBe(false);

    // Another browser still opens it.
    anotherBrowser();
    await expect(unlockOrderAction({ message: null }, right)).rejects.toThrow(
      `NEXT_REDIRECT:/checkout/confirmacion/${order.number}`,
    );
  });
});

describe("trackOrderAction", () => {
  const NOT_FOUND = {
    title: "Revisa estos datos",
    message:
      "No encontramos un pedido con esos datos. Revisa el número y el correo con el que compraste.",
  };

  it("remembers the order for this browser and shows its status", async () => {
    const order = anOrder({ number: "MG-2026-555003" });
    await getOrderRepository().save(order);

    await expect(
      trackOrderAction(
        trackingInitialState(undefined),
        form({ number: "mg 2026 555003", email: " ANA@correo.pe " }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/pedidos/seguimiento?numero=MG-2026-555003",
    );
    expect(jar.get(ORDER_ACCESS_COOKIE)).toBe(
      `${order.number}.${order.accessToken}`,
    );
  });

  it("answers the same neutral message for another email or an unknown number", async () => {
    const order = anOrder({ number: "MG-2026-555004" });
    await getOrderRepository().save(order);

    const wrongEmail = await trackOrderAction(
      trackingInitialState(undefined),
      form({ number: order.number, email: "otra@correo.pe" }),
    );
    const unknown = await trackOrderAction(
      wrongEmail,
      form({ number: "MG-2026-000000", email: "ana@correo.pe" }),
    );

    expect(wrongEmail).toEqual({
      values: { number: order.number, email: "otra@correo.pe" },
      errors: {},
      formError: NOT_FOUND,
      attempt: 1,
    });
    expect(unknown.formError).toEqual(NOT_FOUND);
    expect(unknown.attempt).toBe(2);
    expect(jar.has(ORDER_ACCESS_COOKIE)).toBe(false);
  });

  it("validates the fields before looking anything up", async () => {
    const state = await trackOrderAction(
      trackingInitialState(undefined),
      form({ number: "12345", email: "" }),
    );
    expect(state).toEqual({
      values: { number: "12345", email: "" },
      errors: {
        number: "Revisa el número de pedido: tiene la forma MG-2026-004521.",
        email: "Escribe tu correo electrónico.",
      },
      formError: null,
      attempt: 1,
    });
  });

  it("pauses lookups from a client after 10 failures, even with the right data", async () => {
    const order = anOrder({ number: "MG-2026-555005" });
    await getOrderRepository().save(order);
    let state = trackingInitialState(undefined);
    for (let failure = 0; failure < 10; failure += 1) {
      state = await trackOrderAction(
        state,
        form({ number: order.number, email: "otra@correo.pe" }),
      );
    }

    state = await trackOrderAction(
      state,
      form({ number: order.number, email: "ana@correo.pe" }),
    );

    expect(state.formError).toEqual(TOO_MANY_ATTEMPTS);
    expect(jar.has(ORDER_ACCESS_COOKIE)).toBe(false);

    // Another client still gets in.
    anotherBrowser();
    await expect(
      trackOrderAction(
        state,
        form({ number: order.number, email: "ana@correo.pe" }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/pedidos/seguimiento?numero=MG-2026-555005",
    );
  });
});

describe("order lookups and forged forwarding headers", () => {
  async function failTenTimes(number: string, forwardedFor: () => string) {
    let state = trackingInitialState(undefined);
    for (let failure = 0; failure < 10; failure += 1) {
      requestHeaders.set("x-forwarded-for", forwardedFor());
      requestHeaders.set("x-real-ip", forwardedFor());
      state = await trackOrderAction(
        state,
        form({ number, email: "otra@correo.pe" }),
      );
    }
    return state;
  }

  it("does not reset the pause when a client changes its x-forwarded-for", async () => {
    const order = anOrder({ number: "MG-2026-555008" });
    await getOrderRepository().save(order);
    const state = await failTenTimes(order.number, () =>
      [1, 2, 3, 4].map(() => Math.floor(Math.random() * 256)).join("."),
    );

    requestHeaders.set("x-forwarded-for", "192.0.2.200");
    const next = await trackOrderAction(
      state,
      form({ number: order.number, email: "ana@correo.pe" }),
    );
    expect(next.formError).toEqual(TOO_MANY_ATTEMPTS);
  });

  it("does not pause another client whose address the attacker forged", async () => {
    const order = anOrder({ number: "MG-2026-555009" });
    await getOrderRepository().save(order);
    const victim = "198.51.100.23";
    await failTenTimes(order.number, () => victim);

    anotherBrowser();
    requestHeaders.set("x-forwarded-for", victim);
    await expect(
      trackOrderAction(
        trackingInitialState(undefined),
        form({ number: order.number, email: "ana@correo.pe" }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/pedidos/seguimiento?numero=MG-2026-555009",
    );
    await expect(
      unlockOrderAction(
        { message: null },
        form({ number: order.number, email: "ana@correo.pe" }),
      ),
    ).rejects.toThrow(`NEXT_REDIRECT:/checkout/confirmacion/${order.number}`);
  });
});

describe("trackAnotherOrderAction", () => {
  it("forgets the order of this browser and opens an empty lookup", async () => {
    jar.set(ORDER_ACCESS_COOKIE, `MG-2026-555006.${crypto.randomUUID()}`);

    await expect(trackAnotherOrderAction()).rejects.toThrow(
      "NEXT_REDIRECT:/pedidos/seguimiento",
    );
    expect(setCookie).toHaveBeenCalledWith(
      ORDER_ACCESS_COOKIE,
      "",
      expect.objectContaining({ maxAge: 0, httpOnly: true, path: "/" }),
    );
    expect(jar.get(ORDER_ACCESS_COOKIE)).toBe("");
  });
});
