// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { CART_COOKIE } from "@/modules/cart/infrastructure/cart-cookie";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import { getCheckoutDraftRepository } from "@/modules/checkout/infrastructure";
import { aContact, BOLETA } from "@/modules/checkout/testing/checkout-builders";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { getOrderRepository } from "@/modules/orders/infrastructure";
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

/** A cart with the real catalog price of the Prime Charger and a complete draft. */
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
  return cart.id;
}

beforeEach(() => {
  jar.clear();
  setCookie.mockClear();
  refresh.mockClear();
  // Each test is its own client for the process-wide attempt limiter.
  requestHeaders.set("x-forwarded-for", crypto.randomUUID());
});

describe("placeOrderAction", () => {
  it("pays, stores the order, empties the cart and opens the confirmation", async () => {
    const cartId = await readyToPay();

    const error = await placeOrderAction(initialFormState(), form(CARD)).catch(
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
    await readyToPay();

    const state = await placeOrderAction(
      initialFormState(),
      form({ ...CARD, cardNumber: "4111 1111 1111 1112", acceptTerms: "" }),
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
    const cartId = await readyToPay();

    const state = await placeOrderAction(
      initialFormState(),
      form({ ...CARD, cardNumber: "4000 0000 0000 0002" }),
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
    await readyToPay();
    const state = await placeOrderAction(
      initialFormState(),
      form({ ...CARD, cardNumber: "5555 5555 5555 4444" }),
    );
    expect(state.formError?.message).toContain("4111 1111 1111 1111");
  });

  it("asks to review a cart whose prices changed, without charging", async () => {
    // The cart remembers S/ 150.00 for a charger the catalog sells at S/ 189.90.
    const cartId = await readyToPay({
      lines: [aLine({ unitPrice: 15000 })],
    });

    const state = await placeOrderAction(initialFormState(), form(CARD));

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
    await readyToPay({
      // The cart thinks the Nano Charger is in stock.
      lines: [
        aLine(
          { maxQuantity: 5 },
          { ...aBackorderOffer(), availability: { status: "in_stock" } },
        ),
      ],
    });
    const state = await placeOrderAction(initialFormState(), form(CARD));
    expect(state.formError?.details).toEqual([
      "Nano Charger 45W Smart Display (Blanco): ahora está en importación y llega en 15–20 días.",
    ]);
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

    expect(state.formError).toEqual({
      title: "Demasiados intentos",
      message:
        "Por tu seguridad pausamos las consultas desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
    });
    expect(jar.has(ORDER_ACCESS_COOKIE)).toBe(false);

    // Another client still gets in.
    requestHeaders.set("x-forwarded-for", "198.51.100.77");
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
