// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aBackorderOffer,
  aLine,
  anOffer,
} from "@/modules/cart/testing/cart-builders";
import { lineTotal, summarizeCart } from "./cart-summary";

describe("lineTotal", () => {
  it("multiplies the unit price in céntimos by the quantity", () => {
    expect(lineTotal(aLine({ quantity: 3 }))).toBe(56970);
  });

  it("throws a RangeError when the total is not a safe integer", () => {
    const line = aLine({ unitPrice: Number.MAX_SAFE_INTEGER, quantity: 2 });

    expect(() => lineTotal(line)).toThrow(RangeError);
  });
});

describe("summarizeCart", () => {
  it("summarizes an empty cart", () => {
    expect(summarizeCart([])).toEqual({
      itemCount: 0,
      subtotal: 0,
      hasBackorder: false,
      leadTimeDays: null,
      shippingNote: null,
    });
  });

  it("counts units and adds line totals in céntimos", () => {
    const lines = [aLine({ quantity: 2 }), aLine({}, aBackorderOffer())];

    expect(summarizeCart(lines)).toMatchObject({
      itemCount: 3,
      subtotal: 2 * 18990 + 24890,
    });
  });

  it("has no lead time or note when everything is in stock", () => {
    expect(summarizeCart([aLine()])).toMatchObject({
      hasBackorder: false,
      leadTimeDays: null,
      shippingNote: null,
    });
  });

  it("ships a backorder-only cart when it arrives", () => {
    expect(summarizeCart([aLine({}, aBackorderOffer())])).toMatchObject({
      hasBackorder: true,
      leadTimeDays: { min: 15, max: 20 },
      shippingNote: "ships_on_arrival",
    });
  });

  it("ships a mixed cart together when everything is available", () => {
    const lines = [aLine(), aLine({}, aBackorderOffer())];

    expect(summarizeCart(lines)).toMatchObject({
      hasBackorder: true,
      shippingNote: "ships_together_when_available",
    });
  });

  it("takes the latest arrival across backorder lines", () => {
    const early = aBackorderOffer({
      sku: "ANK-A121D-BLK",
      availability: { status: "backorder", leadTimeDays: { min: 10, max: 25 } },
    });
    const lines = [
      aLine({}, aBackorderOffer()),
      aLine({}, early),
      aLine({}, anOffer()),
    ];

    expect(summarizeCart(lines).leadTimeDays).toEqual({ min: 15, max: 25 });
  });
});
