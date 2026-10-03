// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { compareProducts, ProductComparisonError } from "./compare-products";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

async function reasonFor(slugs: string[]): Promise<string> {
  try {
    await compareProducts(repository, slugs);
  } catch (error) {
    if (error instanceof ProductComparisonError) return error.reason;
    throw error;
  }
  throw new Error("Expected a ProductComparisonError");
}

describe("compareProducts", () => {
  it("returns the products in the requested order with one row per comparable spec", async () => {
    const comparison = await compareProducts(repository, [
      "nexode-65w",
      "nano-45w",
    ]);

    expect(comparison.category).toEqual(CHARGERS);
    expect(comparison.products.map((product) => product.slug)).toEqual([
      "nexode-65w",
      "nano-45w",
    ]);
    // "Contenido de la caja" is not comparable.
    expect(comparison.rows).toEqual([
      {
        key: "maxPower",
        label: "Potencia máxima",
        unit: "W",
        kind: "number",
        values: [65, 45],
        differs: true,
      },
      {
        key: "ports",
        label: "Puertos",
        kind: "list",
        values: [["USB-C", "USB-A"], ["USB-C"]],
        differs: true,
      },
      {
        key: "technology",
        label: "Tecnología",
        kind: "text",
        values: ["GaN", "GaN"],
        differs: false,
      },
      {
        key: "display",
        label: "Pantalla",
        kind: "boolean",
        values: [false, true],
        differs: true,
      },
      {
        key: "weight",
        label: "Peso",
        unit: "g",
        kind: "number",
        values: [null, 75],
        differs: true,
      },
    ]);
  });

  it("leaves out rows that no compared product has", async () => {
    const comparison = await compareProducts(repository, [
      "nexode-65w",
      "cargador-basico-20w",
    ]);

    expect(comparison.rows.map((row) => row.key)).toEqual([
      "maxPower",
      "ports",
      "technology",
      "display",
    ]);
  });

  it("compares up to four products", async () => {
    const comparison = await compareProducts(repository, [
      "nano-45w",
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);

    expect(comparison.products).toHaveLength(4);
  });

  it.each([
    ["count", ["nano-45w"]],
    [
      "count",
      [
        "nano-45w",
        "prime-100w",
        "nexode-65w",
        "cargador-basico-20w",
        "cable-usb-c-1m",
      ],
    ],
    ["duplicate", ["nano-45w", "nano-45w"]],
    ["not_found", ["nano-45w", "no-existe"]],
    ["mixed_categories", ["nano-45w", "cable-usb-c-1m"]],
  ])("rejects with reason %s for %j", async (reason, slugs) => {
    expect(await reasonFor(slugs)).toBe(reason);
  });

  it("explains the error in its message", async () => {
    await expect(
      compareProducts(repository, ["nano-45w", "no-existe", "tampoco"]),
    ).rejects.toThrow('Unknown products: "no-existe", "tampoco"');
    await expect(
      compareProducts(repository, ["nano-45w", "cable-usb-c-1m"]),
    ).rejects.toThrow(
      "Products from different categories cannot be compared: cargadores, cables",
    );
    await expect(compareProducts(repository, ["nano-45w"])).rejects.toThrow(
      "Compare from 2 to 4 products, got 1",
    );
  });
});
