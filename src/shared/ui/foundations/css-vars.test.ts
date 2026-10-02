import { describe, expect, it } from "vitest";
import { readCssVar, toHexColor, toPixels } from "./css-vars";

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
    ["rgb(1,2,3)", "#010203"],
    ["rgb( 252 , 186 , 3 )", "#fcba03"],
    ["rgb(15 14 12)", "#0f0e0c"],
    ["rgb(  0   0  255 )", "#0000ff"],
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

  it.each([
    "rgb(255255255)",
    "rgb(12 3)",
    "rgb(1, 2 3)",
    "rgb(1 2, 3)",
    "rgb(1, 2, 3,)",
    "rgb(256, 0, 0)",
    "rgb(0 0 1000)",
  ])("returns null for malformed %j", (value) => {
    expect(toHexColor(value)).toBeNull();
  });
});

describe("toPixels", () => {
  it.each([
    ["20px", 20],
    [" 8px ", 8],
    ["12.5px", 12.5],
    ["0px", 0],
  ])("reads %j as %d", (value, expected) => {
    expect(toPixels(value)).toBe(expected);
  });

  it.each(["", "50%", "1.25rem", "px", "-4px", "20px 20px", "calc(20px)"])(
    "returns null for %j (not a single resolved pixel length)",
    (value) => {
      expect(toPixels(value)).toBeNull();
    },
  );
});
