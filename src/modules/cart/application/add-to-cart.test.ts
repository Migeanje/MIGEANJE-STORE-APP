// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aBackorderOffer,
  aCart,
  aLine,
  anOffer,
  CART_ID,
  fakeCarts,
  fakeProducts,
  NEW_CART_ID,
} from "@/modules/cart/testing/cart-builders";
import { addToCart } from "./add-to-cart";

const UNAVAILABLE = anOffer({
  sku: "APL-MFHP4",
  availability: { status: "unavailable" },
});

function services(carts = fakeCarts()) {
  return {
    carts,
    deps: {
      carts: carts.repository,
      products: fakeProducts([anOffer(), aBackorderOffer(), UNAVAILABLE]),
    },
  };
}

describe("addToCart", () => {
  it("creates a cart when there is none and saves the new line", async () => {
    const { carts, deps } = services();

    const outcome = await addToCart(deps, undefined, {
      sku: "ANK-A2688",
      quantity: 2,
    });

    expect(outcome).toEqual({
      ok: true,
      cart: aCart([aLine({ quantity: 2 })], NEW_CART_ID),
      line: aLine({ quantity: 2 }),
      added: 2,
      clamped: null,
    });
    expect(carts.store.get(NEW_CART_ID)).toEqual(
      aCart([aLine({ quantity: 2 })], NEW_CART_ID),
    );
  });

  it("adds to the existing cart of the cookie", async () => {
    const { carts, deps } = services(fakeCarts([aCart([aLine()])]));

    const outcome = await addToCart(deps, CART_ID, {
      sku: "ANK-A121D-WHT",
      quantity: 1,
    });

    expect(outcome.ok && outcome.cart.id).toBe(CART_ID);
    expect(carts.store.get(CART_ID)?.lines.map((line) => line.sku)).toEqual([
      "ANK-A2688",
      "ANK-A121D-WHT",
    ]);
  });

  it("starts a new cart when the cookie points to a cart that no longer exists", async () => {
    const { deps } = services();

    const outcome = await addToCart(deps, CART_ID, {
      sku: "ANK-A2688",
      quantity: 1,
    });

    expect(outcome.ok && outcome.cart.id).toBe(NEW_CART_ID);
  });

  it("takes the price and availability from the catalog, never from the request", async () => {
    const stale = aLine({ unitPrice: 100, quantity: 1 });
    const { deps } = services(fakeCarts([aCart([stale])]));

    const outcome = await addToCart(deps, CART_ID, {
      sku: "ANK-A2688",
      quantity: 1,
    });

    expect(outcome.ok && outcome.line.unitPrice).toBe(18990);
  });

  it("reports a clamp to the limit", async () => {
    const { deps } = services();

    const outcome = await addToCart(deps, undefined, {
      sku: "ANK-A121D-WHT",
      quantity: 3,
    });

    expect(outcome).toMatchObject({
      ok: true,
      added: 2,
      clamped: { requested: 3, limit: { max: 2, reason: "backorder_limit" } },
    });
  });

  it("answers unknown_sku without creating a cart", async () => {
    const { carts, deps } = services();

    expect(
      await addToCart(deps, undefined, { sku: "NOPE-1", quantity: 1 }),
    ).toEqual({ ok: false, error: { code: "unknown_sku" } });
    expect(carts.store.size).toBe(0);
  });

  it("answers unavailable without creating a cart", async () => {
    const { carts, deps } = services();

    expect(
      await addToCart(deps, undefined, { sku: "APL-MFHP4", quantity: 1 }),
    ).toEqual({
      ok: false,
      error: { code: "unavailable", product: UNAVAILABLE.product },
    });
    expect(carts.store.size).toBe(0);
  });

  it("answers limit_reached and leaves the cart as it was", async () => {
    const full = aCart([aLine({ quantity: 5 })]);
    const { carts, deps } = services(fakeCarts([full]));

    expect(
      await addToCart(deps, CART_ID, { sku: "ANK-A2688", quantity: 1 }),
    ).toEqual({
      ok: false,
      error: {
        code: "limit_reached",
        product: anOffer().product,
        limit: { max: 5, reason: "in_stock_limit" },
        quantity: 5,
      },
    });
    expect(carts.store.get(CART_ID)).toBe(full);
  });
});
