// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildProduct,
  buildTestCatalog,
  buildVariant,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { type Catalog, catalogSchema, parseCatalog } from "./catalog";

function withProduct(overrides: Parameters<typeof buildProduct>[0]): Catalog {
  const catalog = buildTestCatalog();
  return {
    ...catalog,
    products: [...catalog.products, buildProduct(overrides)],
  };
}

function issuesOf(catalog: unknown): string[] {
  const result = catalogSchema.safeParse(catalog);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("catalogSchema", () => {
  it("accepts a consistent catalog", () => {
    const catalog = buildTestCatalog();

    expect(catalogSchema.parse(catalog)).toEqual(catalog);
  });

  it("requires the product brand to exist with the same name", () => {
    expect(
      issuesOf(withProduct({ brand: { slug: "belkin", name: "Belkin" } })),
    ).toContain('Unknown brand "belkin"');
    expect(
      issuesOf(withProduct({ brand: { slug: "anker", name: "ANKER" } })),
    ).toContain('Brand "anker" is named "Anker", not "ANKER"');
  });

  it("requires the product category to exist with the same name", () => {
    expect(
      issuesOf(withProduct({ category: { slug: "drones", name: "Drones" } })),
    ).toContain('Unknown category "drones"');
    expect(
      issuesOf(
        withProduct({ category: { slug: "cargadores", name: "Cargador" } }),
      ),
    ).toContain('Category "cargadores" is named "Cargadores", not "Cargador"');
  });

  it("validates spec values against the category spec schema", () => {
    expect(issuesOf(withProduct({ specs: { voltage: 20 } }))).toContain(
      'Spec "voltage" is not defined for category "cargadores"',
    );
    expect(issuesOf(withProduct({ specs: { maxPower: "45 W" } }))).toContain(
      'Spec "maxPower": Expected a finite number, got "45 W"',
    );
  });

  it("names repeated slugs and SKUs across the catalog", () => {
    expect(issuesOf(withProduct({ slug: "nano-45w" }))).toContain(
      'Product slug "nano-45w" is used twice',
    );
    expect(
      issuesOf(
        withProduct({
          slug: "otro",
          variants: [buildVariant({ sku: "PRIME-100" })],
        }),
      ),
    ).toContain('SKU "PRIME-100" is used twice');

    const catalog = buildTestCatalog();
    expect(
      issuesOf({ ...catalog, categories: [...catalog.categories, CHARGERS] }),
    ).toContain('Category slug "cargadores" is used twice');
  });
});

describe("parseCatalog", () => {
  it("returns the parsed catalog", () => {
    expect(parseCatalog(buildTestCatalog()).products).toHaveLength(5);
  });

  it("throws an Error that lists every issue with its path", () => {
    const catalog = withProduct({
      slug: "roto",
      specs: { maxPower: "45 W" },
      variants: [buildVariant({ sku: "ROTO", price: -1 })],
    });

    expect(() => parseCatalog(catalog)).toThrow(/^Invalid catalog data:/);
    expect(() => parseCatalog(catalog)).toThrow(
      /at products\[5\]\.specs\.maxPower/,
    );
    expect(() => parseCatalog(catalog)).toThrow(
      /at products\[5\]\.variants\[0\]\.price/,
    );
  });
});
