// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  BACKORDER_15_20,
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { getProduct } from "./get-product";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

describe("getProduct", () => {
  it("returns null for an unknown slug", async () => {
    expect(await getProduct(repository, "no-existe")).toBeNull();
  });

  it("returns the product with its category, ordered specs, price and availability", async () => {
    const details = await getProduct(repository, "nano-45w");

    expect(details?.product.slug).toBe("nano-45w");
    expect(details?.category).toEqual(CHARGERS);
    expect(
      details?.specs.map(({ label, unit, value }) => ({ label, unit, value })),
    ).toEqual([
      { label: "Potencia máxima", unit: "W", value: 45 },
      { label: "Puertos", unit: undefined, value: ["USB-C"] },
      { label: "Tecnología", unit: undefined, value: "GaN" },
      { label: "Pantalla", unit: undefined, value: true },
      { label: "Peso", unit: "g", value: 75 },
    ]);
    expect(details?.price).toEqual({ from: 24890, to: 24890 });
    // The black variant arrives sooner (10-12 days) than the white one.
    expect(details?.availability).toEqual({
      status: "backorder",
      leadTimeDays: { min: 10, max: 12 },
    });
    expect(details?.availability).not.toEqual(BACKORDER_15_20);
  });

  it("throws when the product's category is missing (a data bug)", async () => {
    const catalog = buildTestCatalog();
    const broken = createInMemoryCatalogRepository({
      ...catalog,
      categories: [],
    });

    await expect(getProduct(broken, "nano-45w")).rejects.toThrow(
      'Product "nano-45w" points to the unknown category "cargadores"',
    );
  });
});
