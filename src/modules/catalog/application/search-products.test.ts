// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createInMemoryCatalogRepository } from "@/modules/catalog/infrastructure/in-memory-catalog-repository";
import { buildTestCatalog } from "@/modules/catalog/testing/catalog-builders";
import {
  MAX_QUERY_LENGTH,
  normalizeSearchQuery,
  searchProducts,
} from "./search-products";

const repository = createInMemoryCatalogRepository(buildTestCatalog());

async function slugsFor(query: string): Promise<string[]> {
  const { products } = await searchProducts(repository, query);
  return products.map((product) => product.slug);
}

describe("searchProducts", () => {
  it("searches name, brand, category and tags ignoring case and accents", async () => {
    expect(await slugsFor("CARGADOR BÁSICO")).toEqual(["cargador-basico-20w"]);
    expect(await slugsFor("ugreen")).toEqual([
      "nexode-65w",
      "cargador-basico-20w",
    ]);
    expect(await slugsFor("cables")).toEqual(["cable-usb-c-1m"]);
    expect(await slugsFor("carga rapida")).toEqual(["nano-45w"]);
  });

  it("returns the query trimmed with single spaces", async () => {
    const result = await searchProducts(repository, "  prime   100W ");

    expect(result.query).toBe("prime 100W");
    expect(result.products.map((product) => product.slug)).toEqual([
      "prime-100w",
    ]);
  });

  it("returns nothing for a blank query without asking the repository", async () => {
    const spy = vi.spyOn(repository, "searchProducts");

    expect(await searchProducts(repository, "   ")).toEqual({
      query: "",
      products: [],
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it(`cuts the query to ${MAX_QUERY_LENGTH} characters`, async () => {
    const result = await searchProducts(repository, "a".repeat(500));

    expect(result.query).toHaveLength(MAX_QUERY_LENGTH);
  });
});

describe("normalizeSearchQuery", () => {
  it.each([
    ["  power   bank ", "power bank"],
    ["\tcargador\n", "cargador"],
    ["", ""],
  ])("normalizes %j to %j", (raw, query) => {
    expect(normalizeSearchQuery(raw)).toBe(query);
  });

  it("is the query searchProducts echoes", async () => {
    const raw = `  ${"b ".repeat(80)}`;

    expect((await searchProducts(repository, raw)).query).toBe(
      normalizeSearchQuery(raw),
    );
    expect(normalizeSearchQuery(raw).length).toBeLessThanOrEqual(
      MAX_QUERY_LENGTH,
    );
  });
});
