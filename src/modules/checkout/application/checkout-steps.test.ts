// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CART_ID } from "@/modules/cart/testing/cart-builders";
import { emptyDraft } from "@/modules/checkout/domain/checkout-draft";
import {
  aContact,
  aFactura,
  BOLETA,
  fakeDrafts,
  fakeUbigeo,
} from "@/modules/checkout/testing/checkout-builders";
import { discardCheckoutDraft } from "./discard-checkout-draft";
import { getCheckoutDraft } from "./get-checkout-draft";
import { saveContact } from "./save-contact";
import { saveReceipt } from "./save-receipt";

const CONTACT_INPUT = {
  customer: aContact().customer,
  address: {
    line: "Av. Larco 1234, dpto. 501",
    reference: "Frente al parque",
    ubigeo: { departamento: "15", provincia: "1501", distrito: "150122" },
  },
};

describe("getCheckoutDraft", () => {
  it("returns null without a cart id", async () => {
    const { repository } = fakeDrafts();
    expect(await getCheckoutDraft(repository, undefined)).toBeNull();
  });

  it("returns an empty, unsaved draft for a cart without one", async () => {
    const { repository, store } = fakeDrafts();
    expect(await getCheckoutDraft(repository, CART_ID)).toEqual(
      emptyDraft(CART_ID),
    );
    expect(store.size).toBe(0);
  });

  it("returns the saved draft", async () => {
    const draft = { cartId: CART_ID, contact: aContact(), receipt: BOLETA };
    const { repository } = fakeDrafts([draft]);
    expect(await getCheckoutDraft(repository, CART_ID)).toEqual(draft);
  });
});

describe("saveContact", () => {
  it("stores the customer and the address with the ubigeo names", async () => {
    const { repository, store } = fakeDrafts();
    const result = await saveContact(
      { drafts: repository, ubigeo: fakeUbigeo() },
      CART_ID,
      CONTACT_INPUT,
    );

    expect(result).toEqual({
      ok: true,
      draft: { cartId: CART_ID, contact: aContact(), receipt: null },
    });
    expect(store.get(CART_ID)).toEqual({
      cartId: CART_ID,
      contact: aContact(),
      receipt: null,
    });
  });

  it("keeps a receipt chosen before", async () => {
    const { repository, store } = fakeDrafts([
      { cartId: CART_ID, contact: null, receipt: BOLETA },
    ]);
    await saveContact(
      { drafts: repository, ubigeo: fakeUbigeo() },
      CART_ID,
      CONTACT_INPUT,
    );
    expect(store.get(CART_ID)?.receipt).toEqual(BOLETA);
  });

  it("refuses a ubigeo that does not exist or does not nest", async () => {
    const { repository, store } = fakeDrafts();
    const result = await saveContact(
      { drafts: repository, ubigeo: fakeUbigeo() },
      CART_ID,
      {
        ...CONTACT_INPUT,
        address: {
          ...CONTACT_INPUT.address,
          ubigeo: { departamento: "15", provincia: "1501", distrito: "070101" },
        },
      },
    );
    expect(result).toEqual({ ok: false, error: "unknown_ubigeo" });
    expect(store.size).toBe(0);
  });
});

describe("saveReceipt", () => {
  const withContact = () =>
    fakeDrafts([{ cartId: CART_ID, contact: aContact(), receipt: null }]);

  it("stores a boleta", async () => {
    const { repository, store } = withContact();
    const result = await saveReceipt(repository, CART_ID, BOLETA, {
      facturaEnabled: false,
    });
    expect(result.ok).toBe(true);
    expect(store.get(CART_ID)?.receipt).toEqual(BOLETA);
  });

  it("refuses a factura while facturas are disabled", async () => {
    const { repository, store } = withContact();
    expect(
      await saveReceipt(repository, CART_ID, aFactura(), {
        facturaEnabled: false,
      }),
    ).toEqual({ ok: false, error: "factura_disabled" });
    expect(store.get(CART_ID)?.receipt).toBeNull();
  });

  it("stores a factura when facturas are enabled", async () => {
    const { repository, store } = withContact();
    await saveReceipt(repository, CART_ID, aFactura(), {
      facturaEnabled: true,
    });
    expect(store.get(CART_ID)?.receipt).toEqual(aFactura());
  });

  it("asks for the contact step first", async () => {
    const { repository } = fakeDrafts();
    expect(
      await saveReceipt(repository, CART_ID, BOLETA, { facturaEnabled: false }),
    ).toEqual({ ok: false, error: "contact_missing" });
  });
});

describe("discardCheckoutDraft", () => {
  it("deletes the draft of the cart", async () => {
    const { repository, store } = fakeDrafts([
      { cartId: CART_ID, contact: aContact(), receipt: BOLETA },
    ]);
    await discardCheckoutDraft(repository, CART_ID);
    expect(store.size).toBe(0);
  });
});
