// @vitest-environment node
import { describe, expect, it } from "vitest";
import { shippingRateRows } from "./shipping-policy";

const NBSP = "\u00A0";

describe("shippingRateRows", () => {
  it("lists the rates checkout charges, per zone, for the shipping policy page", () => {
    expect(shippingRateRows()).toEqual([
      {
        zone: "lima_metro",
        name: "Lima Metropolitana",
        price: `S/${NBSP}10.00`,
        time: "24–48 h (días hábiles)",
      },
      {
        zone: "callao",
        name: "Callao",
        price: `S/${NBSP}12.00`,
        time: "24–48 h (días hábiles)",
      },
      {
        zone: "rest_of_peru",
        name: "Resto del Perú",
        price: `S/${NBSP}20.00`,
        time: "3–5 días hábiles",
      },
    ]);
  });
});
