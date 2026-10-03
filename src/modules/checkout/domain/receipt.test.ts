// @vitest-environment node
import { describe, expect, it } from "vitest";
import { receiptSchema } from "./receipt";

describe("receiptSchema", () => {
  it("accepts a boleta (issued to the customer's document)", () => {
    expect(receiptSchema.parse({ type: "boleta" })).toEqual({ type: "boleta" });
  });

  it("accepts a factura with a valid RUC, razón social and fiscal address", () => {
    const factura = {
      type: "factura",
      ruc: "20131312955",
      businessName: "Empresa Demo S.A.C.",
      fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
    };
    expect(receiptSchema.parse(factura)).toEqual(factura);
  });

  it("rejects a factura with an invalid RUC or missing data", () => {
    const base = {
      type: "factura",
      ruc: "20131312955",
      businessName: "Empresa Demo S.A.C.",
      fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
    };
    expect(
      receiptSchema.safeParse({ ...base, ruc: "20131312954" }).success,
    ).toBe(false);
    expect(
      receiptSchema.safeParse({ ...base, businessName: " " }).success,
    ).toBe(false);
    expect(
      receiptSchema.safeParse({ ...base, fiscalAddress: "" }).success,
    ).toBe(false);
  });

  it("rejects a boleta carrying factura fields", () => {
    expect(
      receiptSchema.safeParse({ type: "boleta", ruc: "20131312955" }).success,
    ).toBe(false);
  });
});
