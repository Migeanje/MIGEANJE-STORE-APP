// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { listRelatedProducts } from "./list-related-products";

const catalog = buildTestCatalog();
const repository = createInMemoryCatalogRepository(catalog);

function product(slug: string) {
  const found = catalog.products.find((entry) => entry.slug === slug);
  if (!found) throw new Error(`No test product "${slug}"`);
  return found;
}

describe("listRelatedProducts", () => {
  it("lists the other products of the same category, in featured order", async () => {
    const related = await listRelatedProducts(repository, product("nano-45w"));

    expect(related.category).toEqual(CHARGERS);
    expect(related.products.map(({ slug }) => slug)).toEqual([
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("keeps at most `limit` products", async () => {
    const related = await listRelatedProducts(
      repository,
      product("nano-45w"),
      2,
    );

    expect(related.products).toHaveLength(2);
  });

  it("is empty when the product is alone in its category", async () => {
    const related = await listRelatedProducts(
      repository,
      product("cable-usb-c-1m"),
    );

    expect(related.products).toEqual([]);
  });

  it("rejects a limit that is not a positive integer", async () => {
    await expect(
      listRelatedProducts(repository, product("nano-45w"), 0),
    ).rejects.toThrow(RangeError);
  });
});
