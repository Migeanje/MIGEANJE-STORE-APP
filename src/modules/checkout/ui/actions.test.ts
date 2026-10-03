// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { CART_COOKIE } from "@/modules/cart/infrastructure/cart-cookie";
import { aLine } from "@/modules/cart/testing/cart-builders";
import { getCheckoutDraftRepository } from "@/modules/checkout/infrastructure";
import { aContact, BOLETA } from "@/modules/checkout/testing/checkout-builders";
import { saveContactAction, saveReceiptAction } from "./actions";
import { initialFormState } from "./checkout-forms";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

const flags = vi.hoisted(() => ({ factura: false }));
vi.mock("@/shared/config/features", () => ({ features: flags }));

const CONTACT_FORM = {
  email: "Ana@Correo.pe",
  firstName: "Ana",
  lastName: "Pérez Quispe",
  documentType: "dni",
  documentNumber: "46027897",
  phone: "987 654 321",
  addressLine: "Av. Larco 1234, dpto. 501",
  addressReference: "Frente al parque",
  departamento: "15",
  provincia: "1501",
  distrito: "150122",
};

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

async function startCart({ withLines = true } = {}) {
  const carts = getCartRepository();
  const cart = await carts.create();
  if (withLines) await carts.save({ ...cart, lines: [aLine()] });
  jar.set(CART_COOKIE, cart.id);
  return cart.id;
}

beforeEach(() => {
  jar.clear();
  flags.factura = false;
});

describe("saveContactAction", () => {
  it("saves the contact with the ubigeo names and goes to the receipt step", async () => {
    const cartId = await startCart();

    await expect(
      saveContactAction(initialFormState(), form(CONTACT_FORM)),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/comprobante");
    expect((await getCheckoutDraftRepository().get(cartId))?.contact).toEqual(
      aContact(),
    );
  });

  it("answers the errors with what was typed and saves nothing", async () => {
    const cartId = await startCart();

    const state = await saveContactAction(
      initialFormState(),
      form({ ...CONTACT_FORM, email: "ana@", phone: "" }),
    );

    expect(state).toEqual({
      values: { ...CONTACT_FORM, email: "ana@", phone: "" },
      errors: {
        email: "Revisa tu correo: debe ser como nombre@correo.com.",
        phone: "Escribe tu celular.",
      },
      formError: null,
      attempt: 1,
    });
    expect(await getCheckoutDraftRepository().get(cartId)).toBeNull();
  });

  it("refuses a distrito missing from the ubigeo list", async () => {
    await startCart();
    const state = await saveContactAction(
      initialFormState(),
      form({ ...CONTACT_FORM, distrito: "150199" }),
    );
    expect(state.errors).toEqual({
      distrito: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
    });
  });

  it("only reloads the ubigeo options for the no-JavaScript refresh", async () => {
    const cartId = await startCart();

    const state = await saveContactAction(
      initialFormState(),
      form({
        ...CONTACT_FORM,
        email: "",
        departamento: "04",
        intent: "ubigeo",
      }),
    );

    // The provincia and distrito of Lima no longer apply to Arequipa.
    expect(state).toEqual({
      values: {
        ...CONTACT_FORM,
        email: "",
        departamento: "04",
        provincia: "",
        distrito: "",
      },
      errors: {},
      formError: null,
      attempt: 0,
    });
    expect(await getCheckoutDraftRepository().get(cartId)).toBeNull();
  });

  it("sends an empty or missing cart back to the cart page", async () => {
    await expect(
      saveContactAction(initialFormState(), form(CONTACT_FORM)),
    ).rejects.toThrow("NEXT_REDIRECT:/carrito");

    await startCart({ withLines: false });
    await expect(
      saveContactAction(initialFormState(), form(CONTACT_FORM)),
    ).rejects.toThrow("NEXT_REDIRECT:/carrito");
  });
});

describe("saveReceiptAction", () => {
  async function withContact() {
    const cartId = await startCart();
    await getCheckoutDraftRepository().save({
      cartId,
      contact: aContact(),
      receipt: null,
    });
    return cartId;
  }

  it("saves a boleta and goes to payment", async () => {
    const cartId = await withContact();
    await expect(
      saveReceiptAction(initialFormState(), form({ receiptType: "boleta" })),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/pago");
    expect((await getCheckoutDraftRepository().get(cartId))?.receipt).toEqual(
      BOLETA,
    );
  });

  it("refuses a factura while the flag is off", async () => {
    await withContact();
    const state = await saveReceiptAction(
      initialFormState(),
      form({
        receiptType: "factura",
        ruc: "20131312955",
        businessName: "Empresa Demo S.A.C.",
        fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
      }),
    );
    expect(state.errors).toEqual({
      receiptType: "Por ahora solo emitimos boletas.",
    });
    expect(state.attempt).toBe(1);
  });

  it("saves a factura when the flag is on", async () => {
    flags.factura = true;
    const cartId = await withContact();
    await expect(
      saveReceiptAction(
        initialFormState(),
        form({
          receiptType: "factura",
          ruc: "20131312955",
          businessName: "Empresa Demo S.A.C.",
          fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/pago");
    expect(
      (await getCheckoutDraftRepository().get(cartId))?.receipt?.type,
    ).toBe("factura");
  });

  it("sends the customer to the contact step when it is missing", async () => {
    await startCart();
    await expect(
      saveReceiptAction(initialFormState(), form({ receiptType: "boleta" })),
    ).rejects.toThrow("NEXT_REDIRECT:/checkout/contacto");
  });

  it("sends an empty cart back to the cart page", async () => {
    await expect(
      saveReceiptAction(initialFormState(), form({ receiptType: "boleta" })),
    ).rejects.toThrow("NEXT_REDIRECT:/carrito");
  });
});
