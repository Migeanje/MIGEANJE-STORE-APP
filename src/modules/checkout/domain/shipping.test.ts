// @vitest-environment node
import { describe, expect, it } from "vitest";
import { quoteShipping, SHIPPING_RATES, shippingZone } from "./shipping";

const LIMA = { departamento: "15", provincia: "1501" };
const CANETE = { departamento: "15", provincia: "1505" };
const CALLAO = { departamento: "07", provincia: "0701" };
const AREQUIPA = { departamento: "04", provincia: "0401" };

describe("shippingZone", () => {
  it("is Lima Metropolitana for the provincia of Lima only", () => {
    expect(shippingZone(LIMA)).toBe("lima_metro");
    // Same departamento, another provincia: the rest of Peru rate.
    expect(shippingZone(CANETE)).toBe("rest_of_peru");
  });

  it("is Callao for the Callao departamento", () => {
    expect(shippingZone(CALLAO)).toBe("callao");
  });

  it("is the rest of Peru everywhere else", () => {
    expect(shippingZone(AREQUIPA)).toBe("rest_of_peru");
  });
});

describe("SHIPPING_RATES", () => {
  it("charges S/ 10.00, S/ 12.00 and S/ 20.00 in céntimos", () => {
    expect(SHIPPING_RATES.lima_metro.cost).toBe(1000);
    expect(SHIPPING_RATES.callao.cost).toBe(1200);
    expect(SHIPPING_RATES.rest_of_peru.cost).toBe(2000);
  });
});

describe("quoteShipping", () => {
  it("delivers in Lima in 1–2 business days (24–48 h)", () => {
    expect(quoteShipping(LIMA, null)).toEqual({
      zone: "lima_metro",
      cost: 1000,
      transitDays: { min: 1, max: 2 },
      leadTimeDays: null,
      deliveryDays: { min: 1, max: 2 },
    });
  });

  it("delivers in Callao in 1–2 business days for S/ 12.00", () => {
    expect(quoteShipping(CALLAO, null)).toMatchObject({
      zone: "callao",
      cost: 1200,
      deliveryDays: { min: 1, max: 2 },
    });
  });

  it("delivers in the rest of Peru in 3–5 business days", () => {
    expect(quoteShipping(AREQUIPA, null)).toMatchObject({
      zone: "rest_of_peru",
      cost: 2000,
      deliveryDays: { min: 3, max: 5 },
    });
  });

  it("adds the backorder lead time to the delivery estimate, not to the cost", () => {
    expect(quoteShipping(AREQUIPA, { min: 15, max: 20 })).toEqual({
      zone: "rest_of_peru",
      cost: 2000,
      transitDays: { min: 3, max: 5 },
      leadTimeDays: { min: 15, max: 20 },
      deliveryDays: { min: 18, max: 25 },
    });
  });
});
