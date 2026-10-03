// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  type Availability,
  availabilitySchema,
  bestAvailability,
  isPurchasable,
} from "./availability";

const IN_STOCK: Availability = { status: "in_stock" };
const UNAVAILABLE: Availability = { status: "unavailable" };

function backorder(min: number, max: number): Availability {
  return { status: "backorder", leadTimeDays: { min, max } };
}

describe("availabilitySchema", () => {
  it.each([IN_STOCK, UNAVAILABLE, backorder(15, 20), backorder(1, 1)])(
    "accepts %j",
    (availability) => {
      expect(availabilitySchema.parse(availability)).toEqual(availability);
    },
  );

  it.each([
    ["a backorder without lead time", { status: "backorder" }],
    ["a lead time below one day", backorder(0, 5)],
    ["a fractional lead time", backorder(1.5, 5)],
    ["min above max", backorder(20, 15)],
    ["an unknown status", { status: "preorder" }],
    ["extra keys", { status: "in_stock", leadTimeDays: { min: 1, max: 2 } }],
  ])("rejects %s", (_label, availability) => {
    expect(availabilitySchema.safeParse(availability).success).toBe(false);
  });
});

describe("isPurchasable", () => {
  it("is true for stock and backorder, false when unavailable", () => {
    expect(isPurchasable(IN_STOCK)).toBe(true);
    expect(isPurchasable(backorder(15, 20))).toBe(true);
    expect(isPurchasable(UNAVAILABLE)).toBe(false);
  });
});

describe("bestAvailability", () => {
  it("prefers stock over any backorder", () => {
    expect(bestAvailability([UNAVAILABLE, backorder(1, 2), IN_STOCK])).toEqual(
      IN_STOCK,
    );
  });

  it("picks the backorder that arrives soonest (latest day first, then earliest)", () => {
    expect(
      bestAvailability([
        backorder(15, 20),
        backorder(10, 25),
        backorder(12, 20),
      ]),
    ).toEqual(backorder(12, 20));
  });

  it("prefers a backorder over unavailable", () => {
    expect(bestAvailability([UNAVAILABLE, backorder(15, 20)])).toEqual(
      backorder(15, 20),
    );
  });

  it("is unavailable when every entry is unavailable", () => {
    expect(bestAvailability([UNAVAILABLE, UNAVAILABLE])).toEqual(UNAVAILABLE);
  });

  it("throws a RangeError for an empty list", () => {
    expect(() => bestAvailability([])).toThrow(RangeError);
  });
});
