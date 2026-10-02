// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance } from "./contrast";

describe("parseHex", () => {
  it("parses 6-digit hex case-insensitively", () => {
    expect(parseHex("#FCBA03")).toEqual({ r: 252, g: 186, b: 3 });
    expect(parseHex("#fcba03")).toEqual({ r: 252, g: 186, b: 3 });
  });

  it("expands 3-digit shorthand", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it.each(["FCBA03", "#FCBA0", "#GGGGGG", "#FCBA0380", ""])(
    "rejects invalid input %j",
    (value) => {
      expect(() => parseHex(value)).toThrow(/hex/i);
    },
  );
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 10);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });

  it("weights green more than red and red more than blue", () => {
    const red = relativeLuminance("#ff0000");
    const green = relativeLuminance("#00ff00");
    const blue = relativeLuminance("#0000ff");

    expect(red).toBeCloseTo(0.2126, 4);
    expect(green).toBeCloseTo(0.7152, 4);
    expect(blue).toBeCloseTo(0.0722, 4);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
  });

  it("is 1 for identical colors", () => {
    expect(contrastRatio("#1c1a17", "#1C1A17")).toBeCloseTo(1, 10);
  });

  it("does not depend on argument order", () => {
    expect(contrastRatio("#FCBA03", "#0F0E0C")).toBe(
      contrastRatio("#0F0E0C", "#FCBA03"),
    );
  });

  it.each([
    ["#0F0E0C", 11.18],
    ["#1C1A17", 10.06],
    ["#2A2723", 8.61],
    ["#FFFFFF", 1.73],
  ])(
    "matches the measured contrast of the brand amber on %s",
    (surface, expected) => {
      expect(contrastRatio("#FCBA03", surface)).toBeCloseTo(expected, 2);
    },
  );
});
