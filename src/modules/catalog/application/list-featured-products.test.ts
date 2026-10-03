// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildProduct,
  buildTestCatalog,
  buildVariant,
} from "@/modules/catalog/testing/catalog-builders";
import { listFeaturedProducts } from "./list-featured-products";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

async function featuredSlugs(limit: number): Promise<string[]> {
  return (await listFeaturedProducts(repository, limit)).map(
    (product) => product.slug,
  );
}

describe("listFeaturedProducts", () => {
  it("picks in-stock products, one per category first, then fills in catalog order", async () => {
    // Chargers in stock: Prime, Nexode. Cables in stock: the 1 m cable.
    expect(await featuredSlugs(6)).toEqual([
      "prime-100w",
      "cable-usb-c-1m",
      "nexode-65w",
    ]);
  });

  it("stops at the limit", async () => {
    expect(await featuredSlugs(2)).toEqual(["prime-100w", "cable-usb-c-1m"]);
    expect(await featuredSlugs(1)).toEqual(["prime-100w"]);
  });

  it("never features backorder or unavailable products", async () => {
    const catalog = buildTestCatalog();
    const onlyBackorder = createInMemoryCatalogRepository({
      ...catalog,
      products: [
        buildProduct({
          slug: "solo-importacion",
          variants: [
            buildVariant({
              availability: {
                status: "backorder",
                leadTimeDays: { min: 15, max: 20 },
              },
            }),
          ],
        }),
      ],
    });

    expect(await listFeaturedProducts(onlyBackorder, 6)).toEqual([]);
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "throws a RangeError for a limit of %d",
    async (limit) => {
      await expect(listFeaturedProducts(repository, limit)).rejects.toThrow(
        RangeError,
      );
    },
  );
});
