// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatPEN } from "@/shared/lib/money";
import { moneySchema } from "./money";

describe("moneySchema", () => {
  it.each([0, 12990, Number.MAX_SAFE_INTEGER])(
    "accepts %s céntimos",
    (amount) => {
      expect(moneySchema.parse(amount)).toBe(amount);
    },
  );

  it.each([
    ["a negative amount", -1],
    ["a fraction", 129.9],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["an unsafe integer", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects %s, like formatPEN", (_label, amount) => {
    expect(moneySchema.safeParse(amount).success).toBe(false);
    expect(() => formatPEN(amount)).toThrow(RangeError);
  });

  it("rejects amounts given as strings", () => {
    expect(moneySchema.safeParse("12990").success).toBe(false);
  });
});
