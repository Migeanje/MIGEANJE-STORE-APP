// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aBackorderOffer,
  aCart,
  aLine,
  anOffer,
  BACKORDER,
  CART_ID,
  IN_STOCK,
} from "@/modules/cart/testing/cart-builders";
import {
  addLine,
  type Cart,
  cartSchema,
  clearLines,
  deleteLine,
  emptyCart,
  MAX_LINE_QUANTITY,
  quantityLimit,
  setLineQuantity,
} from "./cart";

describe("quantityLimit", () => {
  it("allows 5 units in stock and 2 on backorder", () => {
    expect(MAX_LINE_QUANTITY).toEqual({ in_stock: 5, backorder: 2 });
    expect(quantityLimit(IN_STOCK)).toEqual({
      max: 5,
      reason: "in_stock_limit",
    });
    expect(quantityLimit(BACKORDER)).toEqual({
      max: 2,
      reason: "backorder_limit",
    });
  });

  it("lowers the limit to a smaller known stock", () => {
    expect(quantityLimit(IN_STOCK, 3)).toEqual({
      max: 3,
      reason: "stock_limit",
    });
    expect(quantityLimit(IN_STOCK, 9)).toEqual({
      max: 5,
      reason: "in_stock_limit",
    });
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "throws a RangeError for a stock limit of %d",
    (stock) => {
      expect(() => quantityLimit(IN_STOCK, stock)).toThrow(RangeError);
    },
  );
});

describe("emptyCart", () => {
  it("creates a cart without lines", () => {
    expect(emptyCart(CART_ID)).toEqual({ id: CART_ID, lines: [] });
  });

  it("throws for an id that is not a UUID", () => {
    expect(() => emptyCart("cart-1")).toThrow();
  });
});

describe("addLine", () => {
  it("adds a new line with the offer's price, availability and product snapshot", () => {
    const offer = anOffer();
    const result = addLine(aCart(), offer, 2);

    expect(result).toEqual({
      ok: true,
      cart: aCart([aLine({ quantity: 2 })]),
      line: aLine({ quantity: 2 }),
      added: 2,
      clamped: null,
    });
  });

  it("merges the same SKU into one line and refreshes its snapshot", () => {
    const cart = aCart([aLine({ quantity: 1, unitPrice: 17990 })]);
    const result = addLine(cart, anOffer(), 2);

    expect(result.ok && result.cart.lines).toEqual([
      aLine({ quantity: 3, unitPrice: 18990 }),
    ]);
    expect(result.ok && result.added).toBe(2);
  });

  it("keeps other lines in place and appends new SKUs", () => {
    const cart = aCart([aLine()]);
    const result = addLine(cart, aBackorderOffer(), 1);

    expect(result.ok && result.cart.lines.map((line) => line.sku)).toEqual([
      "ANK-A2688",
      "ANK-A121D-WHT",
    ]);
  });

  it("clamps to the limit and says why", () => {
    const cart = aCart([aLine({ quantity: 4 })]);
    const result = addLine(cart, anOffer(), 3);

    expect(result).toMatchObject({
      ok: true,
      line: { quantity: 5 },
      added: 1,
      clamped: { requested: 7, limit: { max: 5, reason: "in_stock_limit" } },
    });
  });

  it("clamps a backorder to 2 units", () => {
    const result = addLine(aCart(), aBackorderOffer(), 4);

    expect(result).toMatchObject({
      ok: true,
      line: { quantity: 2, maxQuantity: 2 },
      added: 2,
      clamped: { requested: 4, limit: { max: 2, reason: "backorder_limit" } },
    });
  });

  it("refuses to add when the line already has the most units allowed", () => {
    const cart = aCart([aLine({ quantity: 5 })]);

    expect(addLine(cart, anOffer(), 1)).toEqual({
      ok: false,
      reason: "limit_reached",
      limit: { max: 5, reason: "in_stock_limit" },
      line: aLine({ quantity: 5 }),
    });
  });

  it("refuses an unavailable product", () => {
    const offer = anOffer({ availability: { status: "unavailable" } });

    expect(addLine(aCart(), offer, 1)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("never changes the cart it receives", () => {
    const cart = aCart([aLine()]);
    const before = structuredClone(cart);

    addLine(cart, anOffer(), 2);

    expect(cart).toEqual(before);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "throws a RangeError for a quantity of %d",
    (quantity) => {
      expect(() => addLine(aCart(), anOffer(), quantity)).toThrow(RangeError);
    },
  );
});

describe("setLineQuantity", () => {
  it("sets the quantity and refreshes the snapshot", () => {
    const cart = aCart([aLine({ quantity: 1, unitPrice: 17990 })]);

    expect(setLineQuantity(cart, anOffer(), 3)).toEqual({
      ok: true,
      cart: aCart([aLine({ quantity: 3 })]),
      line: aLine({ quantity: 3 }),
      clamped: null,
    });
  });

  it("clamps to the limit of the current availability", () => {
    const cart = aCart([aLine({ quantity: 1 })]);
    const nowBackorder = anOffer({ availability: BACKORDER });

    expect(setLineQuantity(cart, nowBackorder, 4)).toMatchObject({
      ok: true,
      line: { quantity: 2, maxQuantity: 2, availability: BACKORDER },
      clamped: { requested: 4, limit: { max: 2, reason: "backorder_limit" } },
    });
  });

  it("answers not_in_cart for a SKU without a line", () => {
    expect(setLineQuantity(aCart(), anOffer(), 2)).toEqual({
      ok: false,
      reason: "not_in_cart",
    });
  });

  it("refuses when the product is no longer available", () => {
    const cart = aCart([aLine()]);
    const offer = anOffer({ availability: { status: "unavailable" } });

    expect(setLineQuantity(cart, offer, 2)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("throws a RangeError for a quantity below 1", () => {
    expect(() => setLineQuantity(aCart([aLine()]), anOffer(), 0)).toThrow(
      RangeError,
    );
  });
});

describe("deleteLine", () => {
  it("removes the line and returns it", () => {
    const backorder = aLine({}, aBackorderOffer());
    const cart = aCart([aLine(), backorder]);

    expect(deleteLine(cart, "ANK-A2688")).toEqual({
      cart: aCart([backorder]),
      removed: aLine(),
    });
  });

  it("is a no-op for a SKU that is not in the cart", () => {
    const cart = aCart([aLine()]);

    expect(deleteLine(cart, "ANK-A2687")).toEqual({ cart, removed: null });
  });
});

describe("clearLines", () => {
  it("keeps the cart id and drops every line", () => {
    expect(clearLines(aCart([aLine()]))).toEqual(aCart());
  });
});

describe("cartSchema", () => {
  const valid: Cart = aCart([aLine(), aLine({}, aBackorderOffer())]);

  it("accepts a valid cart", () => {
    expect(cartSchema.parse(valid)).toEqual(valid);
  });

  it.each<[string, Cart]>([
    ["a quantity above the line maximum", aCart([aLine({ quantity: 6 })])],
    [
      "a maximum above the availability limit",
      aCart([aLine({ quantity: 3, maxQuantity: 3 }, aBackorderOffer())]),
    ],
    ["a zero quantity", aCart([aLine({ quantity: 0 })])],
    ["a fractional price", aCart([aLine({ unitPrice: 189.9 })])],
    ["the same SKU twice", aCart([aLine(), aLine({ quantity: 2 })])],
    ["an id that is not a UUID", aCart([], "cart-1")],
    [
      "an unavailable line",
      aCart([
        {
          ...aLine(),
          availability: { status: "unavailable" },
        } as unknown as Cart["lines"][number],
      ]),
    ],
  ])("rejects %s", (_case, cart) => {
    expect(cartSchema.safeParse(cart).success).toBe(false);
  });
});
