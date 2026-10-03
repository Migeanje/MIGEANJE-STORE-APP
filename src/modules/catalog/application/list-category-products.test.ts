// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { listCategoryProducts } from "./list-category-products";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

describe("listCategoryProducts", () => {
  it("returns null for an unknown category", async () => {
    expect(await listCategoryProducts(repository, "drones")).toBeNull();
  });

  it("lists the category products in catalog order by default", async () => {
    const listing = await listCategoryProducts(repository, "cargadores");

    expect(listing?.category).toEqual(CHARGERS);
    expect(listing?.results.items.map((product) => product.slug)).toEqual([
      "nano-45w",
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
    expect(listing?.results.total).toBe(4);
  });

  it("counts every product of the category, whatever the filters", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: { brands: ["ugreen"] },
    });

    expect(listing?.results.total).toBe(2);
    expect(listing?.categoryTotal).toBe(4);
  });

  it("filters, sorts and paginates the results", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: {
        specs: { ports: { kind: "options", values: ["USB-A"] } },
      },
      sort: "price_desc",
      pagination: { page: 1, pageSize: 1 },
    });

    expect(listing?.results.items.map((product) => product.slug)).toEqual([
      "prime-100w",
    ]);
    expect(listing?.results).toMatchObject({ total: 2, pageCount: 2 });
  });

  it("computes the facets from the whole category, not the filtered results", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: { brands: ["ugreen"] },
    });

    expect(listing?.results.total).toBe(2);
    expect(listing?.facets.brands.map((option) => option.value)).toEqual([
      "anker",
      "ugreen",
    ]);
    expect(listing?.facets.specs.map((facet) => facet.key)).toEqual([
      "maxPower",
      "ports",
      "technology",
      "display",
    ]);
  });

  it("applies and returns only the filters the category supports", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: {
        specs: {
          weight: { kind: "range", max: 80 },
          display: { kind: "toggle" },
        },
      },
    });

    expect(listing?.filters).toEqual({
      specs: { display: { kind: "toggle" } },
    });
    expect(listing?.results.items.map((product) => product.slug)).toEqual([
      "nano-45w",
    ]);
  });

  it("drops brands and options the category does not offer", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: {
        brands: ["ugreen", "sony"],
        specs: { ports: { kind: "options", values: ["USB-A", "Lightning"] } },
      },
    });

    expect(listing?.filters).toEqual({
      brands: ["ugreen"],
      specs: { ports: { kind: "options", values: ["USB-A"] } },
    });
    expect(listing?.results.items.map((product) => product.slug)).toEqual([
      "nexode-65w",
    ]);
  });

  it("never throws on malformed filters from the URL", async () => {
    const listing = await listCategoryProducts(repository, "cargadores", {
      filters: { brands: [null], specs: { ports: null } } as never,
    });

    expect(listing?.filters).toEqual({ brands: [], specs: {} });
    expect(listing?.results.total).toBe(4);
  });
});
