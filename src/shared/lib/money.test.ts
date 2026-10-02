import { describe, expect, it } from "vitest";
import { assertMinorUnits, formatPEN } from "./money";

// es-PE puts a no-break space (U+00A0) between "S/" and the amount.
const NBSP = "\u00A0";

describe("formatPEN", () => {
  it.each([
    [0, `S/${NBSP}0.00`],
    [1, `S/${NBSP}0.01`],
    [99, `S/${NBSP}0.99`],
    [100, `S/${NBSP}1.00`],
    [12990, `S/${NBSP}129.90`],
    [15990, `S/${NBSP}159.90`],
    [159990, `S/${NBSP}1,599.90`],
    [1234567890, `S/${NBSP}12,345,678.90`],
  ])("formats %i céntimos as %s", (minor, expected) => {
    expect(formatPEN(minor)).toBe(expected);
  });

  it("separates the symbol with a no-break space, never a plain space", () => {
    const formatted = formatPEN(12990);

    expect(formatted).toContain(NBSP);
    expect(formatted).not.toContain(" ");
  });

  it("formats the largest safe integer exactly, without float drift", () => {
    // 9007199254740991 / 100 as a float would round the céntimos to .90.
    expect(formatPEN(Number.MAX_SAFE_INTEGER)).toBe(
      `S/${NBSP}90,071,992,547,409.91`,
    );
  });

  it("treats negative zero as zero", () => {
    expect(formatPEN(-0)).toBe(`S/${NBSP}0.00`);
  });

  it.each([
    ["a fraction of a céntimo", 1.5],
    ["a float amount in soles", 129.9],
    ["a negative amount", -1],
    ["a large negative amount", -12990],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY],
    ["an unsafe integer", Number.MAX_SAFE_INTEGER + 1],
  ])("rejects %s with a RangeError", (_label, minor) => {
    expect(() => formatPEN(minor)).toThrow(RangeError);
  });
});

describe("assertMinorUnits", () => {
  it("accepts non-negative safe integers", () => {
    expect(() => assertMinorUnits(0)).not.toThrow();
    expect(() => assertMinorUnits(12990)).not.toThrow();
    expect(() => assertMinorUnits(Number.MAX_SAFE_INTEGER)).not.toThrow();
  });

  it("names the rejected value in the error message", () => {
    expect(() => assertMinorUnits(129.9)).toThrow(/129\.9/);
  });
});
