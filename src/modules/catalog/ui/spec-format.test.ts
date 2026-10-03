// @vitest-environment node
import { describe, expect, it } from "vitest";
import type {
  ResolvedSpec,
  SpecKind,
  SpecValue,
} from "@/modules/catalog/domain/category";
import { formatSpecValue, toSpecListItems } from "./spec-format";

function spec(overrides: Partial<ResolvedSpec>): ResolvedSpec {
  return {
    key: "maxPower",
    label: "Potencia máxima",
    kind: "number",
    filterable: false,
    comparable: true,
    order: 10,
    value: 100,
    ...overrides,
  };
}

describe("formatSpecValue", () => {
  it.each<[SpecKind, SpecValue, string]>([
    ["number", 100, "100"],
    ["number", 300000, "300,000"],
    ["number", 13.6, "13.6"],
    ["boolean", true, "Sí"],
    ["boolean", false, "No"],
    ["list", ["USB PD", "PPS"], "USB PD, PPS"],
    ["text", "USB-C a USB-C", "USB-C a USB-C"],
  ])("formats a %s spec %j as %s", (kind, value, text) => {
    expect(formatSpecValue({ kind, value })).toBe(text);
  });

  it("falls back to the plain text of a value that does not fit its kind", () => {
    expect(formatSpecValue({ kind: "number", value: "65" })).toBe("65");
    expect(formatSpecValue({ kind: "boolean", value: ["a"] })).toBe("a");
  });
});

describe("toSpecListItems", () => {
  it("maps resolved specs to SpecList rows, with units only on numbers", () => {
    expect(
      toSpecListItems([
        spec({ value: 100, unit: "W" }),
        spec({
          key: "display",
          label: "Pantalla",
          kind: "boolean",
          value: true,
        }),
      ]),
    ).toEqual([
      { label: "Potencia máxima", value: "100", unit: "W" },
      { label: "Pantalla", value: "Sí" },
    ]);
  });
});
