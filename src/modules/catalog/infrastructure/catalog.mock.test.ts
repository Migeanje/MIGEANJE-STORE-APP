// @vitest-environment node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as z from "zod";
import { catalogSchema } from "@/modules/catalog/domain/catalog";
import {
  productAvailability,
  productPrice,
} from "@/modules/catalog/domain/product";
import { createMockCatalogRepository, mockCatalog } from "./catalog.mock";
import { catalogFixtures } from "./fixtures";

const products = mockCatalog.products;

function product(slug: string) {
  const found = products.find((candidate) => candidate.slug === slug);
  if (!found) throw new Error(`Missing fixture "${slug}"`);
  return found;
}

describe("mock catalog fixtures", () => {
  it("all parse with the catalog schema", () => {
    const result = catalogSchema.safeParse(catalogFixtures);

    expect(result.success ? "" : z.prettifyError(result.error)).toBe("");
  });

  it("hold the 19 approved products in 9 categories from 4 brands", () => {
    expect(products).toHaveLength(19);
    expect(mockCatalog.categories.map((category) => category.slug)).toEqual([
      "cargadores",
      "power-banks",
      "cables",
      "hubs-y-docks",
      "carga-inalambrica",
      "audio",
      "almacenamiento",
      "laptops",
      "tablets",
    ]);
    expect(mockCatalog.brands.map((brand) => brand.slug)).toEqual([
      "anker",
      "ugreen",
      "soundcore",
      "apple",
    ]);
    for (const category of mockCatalog.categories) {
      expect(
        products.some((item) => item.category.slug === category.slug),
      ).toBe(true);
    }
  });

  it("map availability as approved: 4 backorders (15-20 days), the Apple group unavailable", () => {
    const byStatus = (status: string) =>
      products
        .filter((item) => productAvailability(item).status === status)
        .map((item) => item.slug);

    expect(byStatus("backorder")).toEqual([
      "anker-nano-charger-45w-smart-display",
      "anker-prime-charger-160w-3-puertos-smart-display",
      "ugreen-revodok-pro-210-10-en-1",
      "ugreen-revodok-max-213-thunderbolt-4-13-en-1",
    ]);
    expect(byStatus("unavailable")).toEqual([
      "macbook-air-13-m5",
      "ipad-air-11-m4",
      "airpods-pro-3",
    ]);
    expect(byStatus("in_stock")).toHaveLength(12);
    for (const item of products) {
      for (const variant of item.variants) {
        if (variant.availability.status === "backorder") {
          expect(variant.availability.leadTimeDays).toEqual({
            min: 15,
            max: 20,
          });
        }
      }
    }
  });

  it("price every variant at S/ x.90", () => {
    for (const item of products) {
      for (const variant of item.variants) {
        expect(variant.price % 100, variant.sku).toBe(90);
      }
    }
    expect(
      productPrice(product("anker-prime-charger-100w-3-puertos")).from,
    ).toBe(18990);
    expect(productPrice(product("macbook-air-13-m5")).from).toBe(649890);
  });

  it("reference placeholder images that exist in public/", () => {
    for (const item of products) {
      for (const image of item.images) {
        expect(
          existsSync(join(process.cwd(), "public", image.src)),
          image.src,
        ).toBe(true);
      }
    }
  });

  it("use the verified values for the conflicting specs", () => {
    expect(product("anker-nano-charger-45w-smart-display").model).toBe("A121D");
    expect(
      product("anker-prime-charger-160w-3-puertos-smart-display").specs
        .maxPortPower,
    ).toBe(140);
    expect(
      product("ugreen-magflow-qi2-25w-2-en-1-plegable").specs.maxPhonePower,
    ).toBe(25);
  });

  it("include at least 6 expert reviews, with the Revodok Pro 210 macOS caveat", () => {
    expect(
      products.filter((item) => item.expertReview !== undefined).length,
    ).toBeGreaterThanOrEqual(6);

    const review = product("ugreen-revodok-pro-210-10-en-1").expertReview;
    expect(JSON.stringify(review)).toMatch(/macOS[^"]*misma imagen/);
  });
});

describe("createMockCatalogRepository", () => {
  it("shares deeply frozen data across the process", async () => {
    const product = await createMockCatalogRepository().getProductBySlug(
      "anker-prime-charger-100w-3-puertos",
    );
    if (!product) throw new Error("Missing fixture");

    expect(Object.isFrozen(mockCatalog)).toBe(true);
    expect(Object.isFrozen(mockCatalog.products[0]?.variants[0])).toBe(true);
    expect(() => {
      product.name = "Otro";
    }).toThrow(TypeError);
    expect(
      (
        await createMockCatalogRepository().getProductBySlug(
          "anker-prime-charger-100w-3-puertos",
        )
      )?.name,
    ).toBe(product.name);
  });

  it("serves the parsed fixtures", async () => {
    const repository = createMockCatalogRepository();

    expect((await repository.listProducts()).total).toBe(19);
    expect(
      (await repository.searchProducts("revodok")).map((item) => item.slug),
    ).toEqual([
      "ugreen-revodok-pro-210-10-en-1",
      "ugreen-revodok-max-213-thunderbolt-4-13-en-1",
    ]);
  });
});
