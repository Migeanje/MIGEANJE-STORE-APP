// @vitest-environment node
import { describe, expect, it } from "vitest";
import { business } from "./business";

describe("business", () => {
  it("identifies the store by its trade name", () => {
    expect(business.tradeName).toBe("Migeanje Store");
  });

  it("keeps the legal identity pending until the RUC exists (DRAFT)", () => {
    // Fill these in one reviewed commit when the RUC is issued: every
    // Hoja de Reclamación filed from then on carries them.
    expect(business.legalName).toBeNull();
    expect(business.ruc).toBeNull();
    expect(business.address).toBeNull();
  });
});
