// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { CartOffer } from "@/modules/cart/domain/cart";
import {
  aBackorderOffer,
  aCart,
  aLine,
  anOffer,
  BACKORDER,
  CART_ID,
  fakeCarts,
  fakeProducts,
} from "@/modules/cart/testing/cart-builders";
import { updateLineQuantity } from "./update-line-quantity";

function setup(offers: CartOffer[] = [anOffer(), aBackorderOffer()]) {
  const carts = fakeCarts([aCart([aLine({ quantity: 1, unitPrice: 100 })])]);
  return {
    carts,
    deps: { carts: carts.repository, products: fakeProducts(offers) },
  };
}

describe("updateLineQuantity", () => {
  it("sets the quantity with the current catalog price and saves", async () => {
    const { carts, deps } = setup();

    const outcome = await updateLineQuantity(deps, CART_ID, {
      sku: "ANK-A2688",
      quantity: 3,
    });

    expect(outcome).toEqual({
      ok: true,
      cart: aCart([aLine({ quantity: 3 })]),
      line: aLine({ quantity: 3 }),
      clamped: null,
    });
    expect(carts.store.get(CART_ID)).toEqual(aCart([aLine({ quantity: 3 })]));
  });

  it("clamps to the limit of the current availability", async () => {
    const { deps } = setup([anOffer({ availability: BACKORDER })]);

    const outcome = await updateLineQuantity(deps, CART_ID, {
      sku: "ANK-A2688",
      quantity: 5,
    });

    expect(outcome).toMatchObject({
      ok: true,
      line: { quantity: 2 },
      clamped: { requested: 5, limit: { max: 2, reason: "backorder_limit" } },
    });
  });

  it.each([undefined, "7d1e9b0a-2c3d-4e5f-8a9b-0c1d2e3f4a5b"])(
    "answers not_in_cart without a cart (%s)",
    async (cartId) => {
      const { deps } = setup();

      expect(
        await updateLineQuantity(deps, cartId, {
          sku: "ANK-A2688",
          quantity: 2,
        }),
      ).toEqual({ ok: false, error: { code: "not_in_cart" } });
    },
  );

  it("answers not_in_cart for a SKU without a line", async () => {
    const { deps } = setup();

    expect(
      await updateLineQuantity(deps, CART_ID, {
        sku: "ANK-A121D-WHT",
        quantity: 2,
      }),
    ).toEqual({ ok: false, error: { code: "not_in_cart" } });
  });

  it("answers unknown_sku when the catalog no longer has the product", async () => {
    const { carts, deps } = setup([]);

    expect(
      await updateLineQuantity(deps, CART_ID, {
        sku: "ANK-A2688",
        quantity: 2,
      }),
    ).toEqual({
      ok: false,
      error: { code: "unknown_sku", product: anOffer().product },
    });
    expect(carts.store.get(CART_ID)?.lines[0]?.quantity).toBe(1);
  });

  it("answers unavailable and keeps the line as it was", async () => {
    const { carts, deps } = setup([
      anOffer({ availability: { status: "unavailable" } }),
    ]);

    expect(
      await updateLineQuantity(deps, CART_ID, {
        sku: "ANK-A2688",
        quantity: 2,
      }),
    ).toEqual({
      ok: false,
      error: { code: "unavailable", product: anOffer().product },
    });
    expect(carts.store.get(CART_ID)?.lines[0]?.quantity).toBe(1);
  });
});
