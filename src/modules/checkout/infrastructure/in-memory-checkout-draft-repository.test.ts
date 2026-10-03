// @vitest-environment node
import { describe, expect, it } from "vitest";
import { CART_ID } from "@/modules/cart/testing/cart-builders";
import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import { aContact, BOLETA } from "@/modules/checkout/testing/checkout-builders";
import { createInMemoryCheckoutDraftRepository } from "./in-memory-checkout-draft-repository";

describe("createInMemoryCheckoutDraftRepository", () => {
  it("returns null for a cart without a draft", async () => {
    const drafts = createInMemoryCheckoutDraftRepository();
    expect(await drafts.get(CART_ID)).toBeNull();
  });

  it("stores and returns deep copies", async () => {
    const drafts = createInMemoryCheckoutDraftRepository();
    const draft: CheckoutDraft = {
      cartId: CART_ID,
      contact: aContact(),
      receipt: BOLETA,
    };
    await drafts.save(draft);

    // Changing what was saved or what was read never changes the store.
    if (draft.contact) draft.contact.customer.firstName = "Changed";
    const read = await drafts.get(CART_ID);
    expect(read?.contact?.customer.firstName).toBe("Ana");
    if (read?.contact) read.contact.customer.firstName = "Changed again";
    expect((await drafts.get(CART_ID))?.contact?.customer.firstName).toBe(
      "Ana",
    );
  });

  it("validates drafts before storing them", async () => {
    const drafts = createInMemoryCheckoutDraftRepository();
    await expect(
      drafts.save({
        cartId: CART_ID,
        contact: {
          ...aContact(),
          customer: { ...aContact().customer, phone: "1" },
        },
        receipt: null,
      }),
    ).rejects.toThrow();
    expect(await drafts.get(CART_ID)).toBeNull();
  });

  it("deletes a draft", async () => {
    const drafts = createInMemoryCheckoutDraftRepository();
    await drafts.save({ cartId: CART_ID, contact: null, receipt: BOLETA });
    await drafts.delete(CART_ID);
    expect(await drafts.get(CART_ID)).toBeNull();
  });
});
