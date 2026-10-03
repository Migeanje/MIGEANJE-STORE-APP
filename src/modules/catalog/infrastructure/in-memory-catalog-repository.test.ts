// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildTestCatalog } from "@/modules/catalog/testing/catalog-builders";
import { createInMemoryCatalogRepository } from "./in-memory-catalog-repository";

const catalog = buildTestCatalog();
const repository = createInMemoryCatalogRepository(catalog);

function slugs(products: { slug: string }[]): string[] {
  return products.map((product) => product.slug);
}

describe("createInMemoryCatalogRepository", () => {
  it("lists the categories and the brands", async () => {
    expect(await repository.listCategories()).toEqual(catalog.categories);
    expect(await repository.listBrands()).toEqual(catalog.brands);
  });

  it("lists every product as one page without a query", async () => {
    const page = await repository.listProducts();

    expect(page.total).toBe(5);
    expect(page.pageCount).toBe(1);
    expect(page.items).toEqual(catalog.products);
  });

  it("narrows by category and brand, then filters, sorts and paginates", async () => {
    expect(
      slugs((await repository.listProducts({ categorySlug: "cables" })).items),
    ).toEqual(["cable-usb-c-1m"]);
    expect(
      slugs((await repository.listProducts({ brandSlug: "ugreen" })).items),
    ).toEqual(["nexode-65w", "cargador-basico-20w"]);

    const page = await repository.listProducts({
      categorySlug: "cargadores",
      filters: { specs: { technology: { kind: "options", values: ["GaN"] } } },
      sort: "price_asc",
      pagination: { page: 1, pageSize: 2 },
    });
    expect(slugs(page.items)).toEqual(["nexode-65w", "prime-100w"]);
    expect(page).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 2,
      pageCount: 2,
    });
  });

  it("gets a product by slug, or null", async () => {
    expect((await repository.getProductBySlug("prime-100w"))?.name).toBe(
      "Prime Charger 100W",
    );
    expect(await repository.getProductBySlug("no-existe")).toBeNull();
  });

  it("gets products by slugs in the requested order, skipping unknown ones", async () => {
    expect(
      slugs(
        await repository.getProductsBySlugs([
          "nexode-65w",
          "no-existe",
          "nano-45w",
        ]),
      ),
    ).toEqual(["nexode-65w", "nano-45w"]);
  });

  it("searches by text", async () => {
    expect(slugs(await repository.searchProducts("TRENZADO"))).toEqual([
      "cable-usb-c-1m",
    ]);
    expect(await repository.searchProducts("  ")).toEqual([]);
  });

  it("returns frozen data, so one caller cannot change what later calls return", async () => {
    const shared = createInMemoryCatalogRepository(buildTestCatalog());
    const [category] = await shared.listCategories();
    const product = await shared.getProductBySlug("nano-45w");
    if (!category || !product) throw new Error("Missing test data");

    expect(() => {
      category.name = "Otra";
    }).toThrow(TypeError);
    expect(() => {
      product.variants[0].price = 1;
    }).toThrow(TypeError);
    expect(() => {
      product.specs.maxPower = 1;
    }).toThrow(TypeError);
    expect(() => product.tags.push("oferta")).toThrow(TypeError);
    const brands = await shared.listBrands();
    expect(() => brands.push({ slug: "x", name: "X" })).toThrow(TypeError);

    expect((await shared.listCategories())[0]?.name).toBe("Cargadores");
    expect((await shared.getProductBySlug("nano-45w"))?.variants[0]).toEqual(
      expect.objectContaining({ price: 24890 }),
    );
  });

  it("keeps its own snapshot: later changes to the source catalog do not leak in", async () => {
    const source = buildTestCatalog();
    const snapshot = createInMemoryCatalogRepository(source);

    source.categories.pop();
    if (source.products[0]) source.products[0].name = "Cambiado";

    expect(await snapshot.listCategories()).toHaveLength(2);
    expect((await snapshot.getProductBySlug("nano-45w"))?.name).toBe(
      "Nano Charger 45W",
    );
    // The caller's catalog is not frozen as a side effect.
    expect(Object.isFrozen(source.products)).toBe(false);
  });
});
