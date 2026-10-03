// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CART_ID } from "@/modules/cart/testing/cart-builders";
import {
  aContact,
  aFactura,
  BOLETA,
} from "@/modules/checkout/testing/checkout-builders";
import { checkoutDraftSchema, emptyDraft, pendingStep } from "./checkout-draft";

describe("checkoutDraftSchema", () => {
  it("accepts an empty draft for a cart", () => {
    expect(checkoutDraftSchema.parse(emptyDraft(CART_ID))).toEqual({
      cartId: CART_ID,
      contact: null,
      receipt: null,
    });
  });

  it("accepts a complete draft", () => {
    const draft = { cartId: CART_ID, contact: aContact(), receipt: BOLETA };
    expect(checkoutDraftSchema.parse(draft)).toEqual(draft);
  });

  it("rejects a draft whose address ubigeo does not nest", () => {
    const contact = aContact();
    expect(
      checkoutDraftSchema.safeParse({
        cartId: CART_ID,
        contact: {
          ...contact,
          address: {
            ...contact.address,
            ubigeo: {
              ...contact.address.ubigeo,
              distrito: { code: "070101", name: "Callao" },
            },
          },
        },
        receipt: null,
      }).success,
    ).toBe(false);
  });

  it("throws for a cart id that is not a UUID", () => {
    expect(() => emptyDraft("not-a-uuid")).toThrow();
  });
});

describe("pendingStep", () => {
  const options = { facturaEnabled: false };

  it("starts with contact and shipping", () => {
    expect(pendingStep(emptyDraft(CART_ID), options)).toBe("contact");
  });

  it("asks for the receipt once contact is done", () => {
    expect(
      pendingStep(
        { cartId: CART_ID, contact: aContact(), receipt: null },
        options,
      ),
    ).toBe("receipt");
  });

  it("goes to payment once everything is done", () => {
    expect(
      pendingStep(
        { cartId: CART_ID, contact: aContact(), receipt: BOLETA },
        options,
      ),
    ).toBe("payment");
  });

  it("treats a factura as missing while facturas are disabled", () => {
    const draft = { cartId: CART_ID, contact: aContact(), receipt: aFactura() };
    expect(pendingStep(draft, { facturaEnabled: false })).toBe("receipt");
    expect(pendingStep(draft, { facturaEnabled: true })).toBe("payment");
  });

  it("asks for contact first even when a receipt exists", () => {
    expect(
      pendingStep({ cartId: CART_ID, contact: null, receipt: BOLETA }, options),
    ).toBe("contact");
  });
});
