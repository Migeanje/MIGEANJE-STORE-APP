// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import {
  filterProducts,
  type ProductFilters,
  paginate,
  sanitizeFilters,
  sortProducts,
} from "./product-query";

const chargers = buildTestCatalog().products.filter(
  (product) => product.category.slug === "cargadores",
);

function slugsFor(filters: ProductFilters): string[] {
  return filterProducts(chargers, filters).map((product) => product.slug);
}

describe("filterProducts", () => {
  it("keeps everything without filters", () => {
    expect(slugsFor({})).toHaveLength(4);
  });

  it("filters by brand", () => {
    expect(slugsFor({ brands: ["ugreen"] })).toEqual([
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("filters by the derived product availability", () => {
    expect(slugsFor({ availability: ["backorder"] })).toEqual(["nano-45w"]);
    expect(slugsFor({ availability: ["in_stock", "unavailable"] })).toEqual([
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("filters a number spec by an inclusive range", () => {
    expect(
      slugsFor({ specs: { maxPower: { kind: "range", min: 45, max: 65 } } }),
    ).toEqual(["nano-45w", "nexode-65w"]);
    expect(
      slugsFor({ specs: { maxPower: { kind: "range", min: 66 } } }),
    ).toEqual(["prime-100w"]);
  });

  it("filters text and list specs by any of the selected options", () => {
    expect(
      slugsFor({ specs: { ports: { kind: "options", values: ["USB-A"] } } }),
    ).toEqual(["prime-100w", "nexode-65w"]);
    expect(
      slugsFor({
        specs: { technology: { kind: "options", values: ["Silicio", "GaN"] } },
      }),
    ).toHaveLength(4);
  });

  it("filters a boolean spec with a toggle", () => {
    expect(slugsFor({ specs: { display: { kind: "toggle" } } })).toEqual([
      "nano-45w",
    ]);
  });

  it("combines filters with AND and skips products without the spec", () => {
    expect(
      slugsFor({
        brands: ["anker"],
        specs: { ports: { kind: "options", values: ["USB-A"] } },
      }),
    ).toEqual(["prime-100w"]);
    // Básico has no display value: a toggle never matches a missing value.
    expect(
      slugsFor({ brands: ["ugreen"], specs: { display: { kind: "toggle" } } }),
    ).toEqual([]);
  });

  it("ignores empty selections", () => {
    expect(
      slugsFor({
        brands: [],
        availability: [],
        specs: {
          ports: { kind: "options", values: [] },
          maxPower: { kind: "range" },
        },
      }),
    ).toHaveLength(4);
  });
});

describe("sanitizeFilters", () => {
  it("drops unknown, non-filterable and mismatched spec filters", () => {
    expect(
      sanitizeFilters(
        {
          brands: ["anker"],
          specs: {
            maxPower: { kind: "options", values: ["45"] },
            weight: { kind: "range", min: 50 },
            voltage: { kind: "range", min: 5 },
            display: { kind: "toggle" },
            ports: { kind: "options", values: ["USB-C"] },
            technology: { kind: "toggle" },
          },
        },
        CHARGERS,
      ),
    ).toEqual({
      brands: ["anker"],
      specs: {
        display: { kind: "toggle" },
        ports: { kind: "options", values: ["USB-C"] },
      },
    });
  });

  it("drops non-finite bounds and swaps reversed ones", () => {
    expect(
      sanitizeFilters(
        {
          specs: { maxPower: { kind: "range", min: Number.NaN, max: 65 } },
        },
        CHARGERS,
      ),
    ).toEqual({ specs: { maxPower: { kind: "range", max: 65 } } });
    expect(
      sanitizeFilters(
        { specs: { maxPower: { kind: "range", min: 100, max: 45 } } },
        CHARGERS,
      ),
    ).toEqual({ specs: { maxPower: { kind: "range", min: 45, max: 100 } } });
  });
});

describe("sortProducts", () => {
  function sorted(sort: Parameters<typeof sortProducts>[1]): string[] {
    return sortProducts(chargers, sort).map((product) => product.slug);
  }

  it("keeps the catalog order when featured", () => {
    expect(sorted("featured")).toEqual([
      "nano-45w",
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("sorts by the from price", () => {
    expect(sorted("price_asc")).toEqual([
      "cargador-basico-20w",
      "nexode-65w",
      "prime-100w",
      "nano-45w",
    ]);
    expect(sorted("price_desc")).toEqual([
      "nano-45w",
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("sorts by name with Spanish collation", () => {
    expect(sorted("name_asc")).toEqual([
      "cargador-basico-20w",
      "nano-45w",
      "nexode-65w",
      "prime-100w",
    ]);
  });

  it("does not mutate its input", () => {
    const before = chargers.map((product) => product.slug);
    sortProducts(chargers, "price_asc");

    expect(chargers.map((product) => product.slug)).toEqual(before);
  });
});

describe("paginate", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("returns everything as one page without pagination", () => {
    expect(paginate(items)).toEqual({
      items,
      total: 5,
      page: 1,
      pageSize: 5,
      pageCount: 1,
    });
  });

  it("slices the requested page", () => {
    expect(paginate(items, { page: 2, pageSize: 2 })).toEqual({
      items: ["c", "d"],
      total: 5,
      page: 2,
      pageSize: 2,
      pageCount: 3,
    });
  });

  it("clamps the page into the available pages", () => {
    expect(paginate(items, { page: 9, pageSize: 2 })).toMatchObject({
      items: ["e"],
      page: 3,
    });
    expect(paginate(items, { page: 0, pageSize: 2 }).page).toBe(1);
    expect(paginate(items, { page: Number.NaN, pageSize: 2 }).page).toBe(1);
    expect(paginate([], { page: 3, pageSize: 2 })).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 2,
      pageCount: 1,
    });
  });

  it("clamps the page size to whole numbers from 1 to 100", () => {
    expect(paginate(items, { page: 1, pageSize: 0 }).pageSize).toBe(1);
    expect(paginate(items, { page: 1, pageSize: 2.7 }).pageSize).toBe(2);
    expect(paginate(items, { page: 1, pageSize: 500 }).pageSize).toBe(100);
  });
});
