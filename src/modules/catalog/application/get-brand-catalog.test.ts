// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  ANKER,
  buildTestCatalog,
  CABLES,
  CHARGERS,
  UGREEN,
} from "@/modules/catalog/testing/catalog-builders";
import { getBrandCatalog } from "./get-brand-catalog";

const SONY = { slug: "sony", name: "Sony" };

const repository = createInMemoryCatalogRepository({
  ...buildTestCatalog(),
  brands: [ANKER, UGREEN, SONY],
});

function slugsOf(catalog: Awaited<ReturnType<typeof getBrandCatalog>>) {
  return catalog?.groups.map(({ category, products }) => [
    category.slug,
    products.map((product) => product.slug),
  ]);
}

describe("getBrandCatalog", () => {
  it("returns null for an unknown brand", async () => {
    expect(await getBrandCatalog(repository, "xiaomi")).toBeNull();
  });

  it("groups the brand's products by category, in catalog order", async () => {
    const catalog = await getBrandCatalog(repository, "anker");

    expect(catalog?.brand).toEqual(ANKER);
    expect(catalog?.total).toBe(3);
    expect(slugsOf(catalog)).toEqual([
      [CHARGERS.slug, ["nano-45w", "prime-100w"]],
      [CABLES.slug, ["cable-usb-c-1m"]],
    ]);
    expect(catalog?.groups[0]?.category).toEqual(CHARGERS);
  });

  it("leaves out categories without products of the brand", async () => {
    expect(slugsOf(await getBrandCatalog(repository, "ugreen"))).toEqual([
      [CHARGERS.slug, ["nexode-65w", "cargador-basico-20w"]],
    ]);
  });

  it("returns a brand without products with no groups", async () => {
    expect(await getBrandCatalog(repository, "sony")).toEqual({
      brand: SONY,
      groups: [],
      total: 0,
    });
  });
});
