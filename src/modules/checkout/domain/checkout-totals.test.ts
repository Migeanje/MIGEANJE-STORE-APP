// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import { checkoutTotals } from "./checkout-totals";

const LIMA = { departamento: "15", provincia: "1501" };
const AREQUIPA = { departamento: "04", provincia: "0401" };

describe("checkoutTotals", () => {
  it("adds shipping to the subtotal once the address is known", () => {
    // 2 × S/ 189.90 + S/ 10.00 to Lima.
    expect(checkoutTotals([aLine({ quantity: 2 })], LIMA)).toEqual({
      itemCount: 2,
      subtotal: 37980,
      leadTimeDays: null,
      shipping: {
        zone: "lima_metro",
        cost: 1000,
        transitDays: { min: 1, max: 2 },
        leadTimeDays: null,
        deliveryDays: { min: 1, max: 2 },
      },
      total: 38980,
    });
  });

  it("has no shipping nor total before the address", () => {
    expect(checkoutTotals([aLine()], null)).toMatchObject({
      subtotal: 18990,
      shipping: null,
      total: null,
    });
  });

  it("carries the latest backorder lead time into the delivery estimate", () => {
    const totals = checkoutTotals(
      [aLine(), aLine({}, aBackorderOffer())],
      AREQUIPA,
    );
    expect(totals.subtotal).toBe(18990 + 24890);
    expect(totals.leadTimeDays).toEqual({ min: 15, max: 20 });
    expect(totals.shipping?.deliveryDays).toEqual({ min: 18, max: 25 });
    expect(totals.total).toBe(18990 + 24890 + 2000);
  });
});
