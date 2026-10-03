// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildTestCatalog,
  CABLES,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { listCategorySummaries } from "./list-category-summaries";

describe("listCategorySummaries", () => {
  it("lists every category in catalog order with its product count", async () => {
    const repository = createInMemoryCatalogRepository(buildTestCatalog());

    expect(await listCategorySummaries(repository)).toEqual([
      { slug: CHARGERS.slug, name: CHARGERS.name, productCount: 4 },
      { slug: CABLES.slug, name: CABLES.name, productCount: 1 },
    ]);
  });

  it("keeps categories without products, with a count of 0", async () => {
    const repository = createInMemoryCatalogRepository({
      ...buildTestCatalog(),
      products: [],
    });

    expect(
      (await listCategorySummaries(repository)).map(
        ({ productCount }) => productCount,
      ),
    ).toEqual([0, 0]);
  });
});
