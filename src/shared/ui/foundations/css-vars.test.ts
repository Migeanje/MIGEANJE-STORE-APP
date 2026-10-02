import { describe, expect, it } from "vitest";
import { readCssVar, toHexColor } from "./css-vars";

function styleWith(values: Record<string, string>) {
  return { getPropertyValue: (name: string) => values[name] ?? "" };
}

describe("readCssVar", () => {
  it("returns the trimmed value of a custom property", () => {
    expect(readCssVar(styleWith({ "--card": "  #1c1a17 " }), "--card")).toBe(
      "#1c1a17",
    );
  });

  it("returns an empty string when the property is not defined", () => {
    expect(readCssVar(styleWith({}), "--missing")).toBe("");
  });
});

describe("toHexColor", () => {
  it.each([
    ["#0f0e0c", "#0f0e0c"],
    ["#FCBA03", "#fcba03"],
    ["  #fcba03  ", "#fcba03"],
    ["#abc", "#aabbcc"],
    ["rgb(252, 186, 3)", "#fcba03"],
    ["rgb(15 14 12)", "#0f0e0c"],
  ])("normalizes %j to %j", (value, expected) => {
    expect(toHexColor(value)).toBe(expected);
  });

  it.each([
    "",
    "transparent",
    "color-mix(in srgb, #fcba03 45%, transparent)",
    "#fcba0380",
    "rgb(300, 0, 0)",
    "rgba(252, 186, 3, 0.5)",
    "rgb(252 186 3 / 50%)",
  ])("returns null for %j (not an opaque sRGB color)", (value) => {
    expect(toHexColor(value)).toBeNull();
  });
});
