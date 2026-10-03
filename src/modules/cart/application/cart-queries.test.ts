// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aBackorderOffer,
  aCart,
  aLine,
  CART_ID,
  fakeCarts,
} from "@/modules/cart/testing/cart-builders";
import { clearCart } from "./clear-cart";
import { getCart } from "./get-cart";
import { removeLine } from "./remove-line";

const backorder = aLine({}, aBackorderOffer());

describe("getCart", () => {
  it("returns the cart of the cookie", async () => {
    const { repository } = fakeCarts([aCart([aLine()])]);

    expect(await getCart(repository, CART_ID)).toEqual(aCart([aLine()]));
  });

  it("returns null without a cookie or for an unknown cart", async () => {
    const { repository } = fakeCarts();

    expect(await getCart(repository, undefined)).toBeNull();
    expect(await getCart(repository, CART_ID)).toBeNull();
  });
});

describe("removeLine", () => {
  it("removes the line, saves and returns what it removed", async () => {
    const { repository, store } = fakeCarts([aCart([aLine(), backorder])]);

    expect(await removeLine(repository, CART_ID, "ANK-A2688")).toEqual({
      cart: aCart([backorder]),
      removed: aLine(),
    });
    expect(store.get(CART_ID)).toEqual(aCart([backorder]));
  });

  it("is a no-op for a SKU that is not in the cart", async () => {
    const cart = aCart([aLine()]);
    const { repository, store } = fakeCarts([cart]);

    expect(await removeLine(repository, CART_ID, "ANK-A2687")).toEqual({
      cart,
      removed: null,
    });
    expect(store.get(CART_ID)).toBe(cart);
  });

  it("answers no cart without a cookie", async () => {
    const { repository } = fakeCarts();

    expect(await removeLine(repository, undefined, "ANK-A2688")).toEqual({
      cart: null,
      removed: null,
    });
  });
});

describe("clearCart", () => {
  it("empties the cart and keeps its id", async () => {
    const { repository, store } = fakeCarts([aCart([aLine(), backorder])]);

    expect(await clearCart(repository, CART_ID)).toEqual(aCart());
    expect(store.get(CART_ID)).toEqual(aCart());
  });

  it("returns null when there is no cart", async () => {
    const { repository } = fakeCarts();

    expect(await clearCart(repository, CART_ID)).toBeNull();
  });
});
