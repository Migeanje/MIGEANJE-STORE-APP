// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Category } from "@/modules/catalog/domain/category";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import { CHARGERS } from "@/modules/catalog/testing/catalog-builders";
import {
  type CategoryQuery,
  categoryHref,
  categorySearchParams,
  parseCategorySearchParams,
  RESERVED_PARAMS,
  searchQueryParam,
  specParams,
} from "./catalog-url";

function mockCategory(slug: string): Category {
  const category = mockCatalog.categories.find((entry) => entry.slug === slug);
  if (!category) throw new Error(`No mock category "${slug}"`);
  return category;
}

const chargers = mockCategory("cargadores");
const cables = mockCategory("cables");

const DEFAULT_QUERY: CategoryQuery = { filters: {}, sort: "featured", page: 1 };

function parse(query: string, category: Category = chargers): CategoryQuery {
  return parseCategorySearchParams(new URLSearchParams(query), category);
}

describe("specParams", () => {
  it("names the filterable specs in Spanish, in display order", () => {
    expect(
      specParams(chargers).map(({ key, name, kind }) => [key, name, kind]),
    ).toEqual([
      ["maxPower", "potencia", "range"],
      ["usbCPorts", "puertos-usb-c", "range"],
      ["display", "pantalla", "toggle"],
    ]);
    expect(specParams(cables).map(({ name }) => name)).toEqual([
      "conectores",
      "potencia",
      "certificacion",
    ]);
  });

  it("gives every mock category unique names that never clash with the fixed params", () => {
    for (const category of mockCatalog.categories) {
      const names = specParams(category).flatMap(({ name }) => [
        name,
        `${name}-desde`,
        `${name}-hasta`,
      ]);
      expect(new Set(names).size).toBe(names.length);
      for (const name of names) expect(RESERVED_PARAMS).not.toContain(name);
    }
  });

  it("falls back to the slugified label for a spec without a mapped name", () => {
    expect(specParams(CHARGERS).map(({ name }) => name)).toEqual([
      "potencia",
      "puertos",
      "tecnologia",
      "pantalla",
    ]);
  });

  it("fails loudly when two specs of a category get the same name", () => {
    const clashing: Category = {
      ...CHARGERS,
      specSchema: [
        ...CHARGERS.specSchema,
        {
          key: "screenSize",
          label: "Tamaño de pantalla",
          unit: "pulgadas",
          kind: "number",
          filterable: true,
          comparable: true,
          order: 99,
        },
      ],
    };
    expect(() => specParams(clashing)).toThrow(/"pantalla"/);
  });
});

describe("parseCategorySearchParams", () => {
  it("defaults to no filters, relevance and the first page", () => {
    expect(parse("")).toEqual(DEFAULT_QUERY);
  });

  it("reads brands, availability, ranges, toggles, sort and page", () => {
    expect(
      parse(
        "marca=anker&marca=ugreen&disponibilidad=en-stock&disponibilidad=en-importacion" +
          "&potencia=60-140&puertos-usb-c=2-&pantalla=si&orden=precio-asc&pagina=2",
      ),
    ).toEqual({
      filters: {
        brands: ["anker", "ugreen"],
        availability: ["in_stock", "backorder"],
        specs: {
          maxPower: { kind: "range", min: 60, max: 140 },
          usbCPorts: { kind: "range", min: 2 },
          display: { kind: "toggle" },
        },
      },
      sort: "price_asc",
      page: 2,
    });
  });

  it("reads option lists, deduped", () => {
    expect(
      parse(
        "conectores=USB-C+a+USB-C&conectores=USB-C+a+Lightning&conectores=USB-C+a+USB-C",
        cables,
      ).filters,
    ).toEqual({
      specs: {
        connectors: {
          kind: "options",
          values: ["USB-C a USB-C", "USB-C a Lightning"],
        },
      },
    });
  });

  it("accepts Next.js searchParams objects", () => {
    expect(
      parseCategorySearchParams(
        {
          marca: ["anker", "ugreen"],
          orden: "precio-desc",
          pagina: undefined,
          potencia: "-100",
        },
        chargers,
      ),
    ).toEqual({
      filters: {
        brands: ["anker", "ugreen"],
        specs: { maxPower: { kind: "range", max: 100 } },
      },
      sort: "price_desc",
      page: 1,
    });
  });

  it("reads the range fields of the no-JavaScript form", () => {
    expect(parse("potencia-desde=45&potencia-hasta=").filters).toEqual({
      specs: { maxPower: { kind: "range", min: 45 } },
    });
    // The canonical param wins over the form fields.
    expect(parse("potencia=60-140&potencia-desde=1").filters).toEqual({
      specs: { maxPower: { kind: "range", min: 60, max: 140 } },
    });
  });

  it("swaps reversed ranges and reads a single number as an exact value", () => {
    expect(parse("potencia=140-60&puertos-usb-c=2").filters).toEqual({
      specs: {
        maxPower: { kind: "range", min: 60, max: 140 },
        usbCPorts: { kind: "range", min: 2, max: 2 },
      },
    });
  });

  it.each([
    ["unknown params", "utm_source=x&color=rojo&q=cargador"],
    ["prototype keys", "__proto__=1&constructor=2&toString=3"],
    ["blank and invalid brands", "marca=&marca=ANKER!!&marca=%20"],
    ["unknown availability", "disponibilidad=pronto&disponibilidad=in_stock"],
    ["broken ranges", "potencia=abc&potencia=-&potencia=1-2-3&potencia=1e3"],
    ["negative and huge numbers", "potencia=--5&puertos-usb-c=1234567890123"],
    ["a toggle that is not 'si'", "pantalla=no&pantalla=true"],
    ["an unknown sort", "orden=barato&orden=price_asc"],
    ["invalid pages", "pagina=0&pagina=-3&pagina=1.5&pagina=abc&pagina=99999"],
    ["specs of other categories", "conectores=USB-C&capacidad=10000-"],
  ])("drops %s", (_label, query) => {
    expect(parse(query)).toEqual(DEFAULT_QUERY);
  });

  it("keeps the valid entries of a param and drops the rest", () => {
    expect(
      parse(
        "marca=anker&marca=No%20Slug&disponibilidad=agotado&disponibilidad=x&orden=x&orden=precio-desc&pagina=x&pagina=3",
      ),
    ).toEqual({
      filters: { brands: ["anker"], availability: ["unavailable"] },
      sort: "price_desc",
      page: 3,
    });
  });

  it("drops option values that are too long or too many", () => {
    const long = "x".repeat(101);
    const many = Array.from(
      { length: 30 },
      (_, index) => `conectores=v${index}`,
    );
    expect(parse(`conectores=${long}`, cables)).toEqual(DEFAULT_QUERY);
    expect(parse(many.join("&"), cables).filters.specs?.connectors).toEqual({
      kind: "options",
      values: Array.from({ length: 20 }, (_, index) => `v${index}`),
    });
  });
});

describe("categorySearchParams", () => {
  it("is empty for the default query", () => {
    expect(categorySearchParams(DEFAULT_QUERY, chargers).toString()).toBe("");
  });

  it("writes params in a canonical order with sorted values", () => {
    const query: CategoryQuery = {
      filters: {
        specs: {
          display: { kind: "toggle" },
          maxPower: { kind: "range", min: 60, max: 140 },
          usbCPorts: { kind: "range", max: 2 },
        },
        availability: ["backorder", "in_stock"],
        brands: ["ugreen", "anker"],
      },
      sort: "price_desc",
      page: 2,
    };

    expect(categorySearchParams(query, chargers).toString()).toBe(
      "marca=anker&marca=ugreen&disponibilidad=en-stock&disponibilidad=en-importacion" +
        "&potencia=60-140&puertos-usb-c=-2&pantalla=si&orden=precio-desc&pagina=2",
    );
  });

  it("omits empty filters, the default sort and the first page", () => {
    expect(
      categorySearchParams(
        {
          filters: {
            brands: [],
            specs: { maxPower: { kind: "range" } },
          },
          sort: "featured",
          page: 1,
        },
        chargers,
      ).toString(),
    ).toBe("");
  });

  it("round-trips through the parser", () => {
    const urls = [
      "marca=anker&disponibilidad=agotado&potencia=45-&pantalla=si&orden=precio-asc&pagina=3",
      "potencia=-100&puertos-usb-c=2-2",
    ];
    for (const url of urls) {
      expect(categorySearchParams(parse(url), chargers).toString()).toBe(url);
    }
    const cableUrl =
      "conectores=USB-C+a+Lightning&conectores=USB-C+a+USB-C&certificacion=MFi";
    expect(
      categorySearchParams(parse(cableUrl, cables), cables).toString(),
    ).toBe(cableUrl);
  });

  it("canonicalizes the no-JavaScript form fields", () => {
    expect(
      categorySearchParams(
        parse(
          "pantalla=si&potencia-desde=60&potencia-hasta=140&marca=ugreen&marca=anker",
        ),
        chargers,
      ).toString(),
    ).toBe("marca=anker&marca=ugreen&potencia=60-140&pantalla=si");
  });
});

describe("categoryHref", () => {
  it("builds the category path with the canonical query", () => {
    expect(categoryHref(chargers, DEFAULT_QUERY)).toBe(
      "/categorias/cargadores",
    );
    expect(
      categoryHref(chargers, {
        ...DEFAULT_QUERY,
        filters: { brands: ["anker"] },
      }),
    ).toBe("/categorias/cargadores?marca=anker");
  });
});

describe("searchQueryParam", () => {
  it.each([
    [{ q: "cargador" }, "cargador"],
    [{ q: ["power bank", "cable"] }, "power bank"],
    [{ q: undefined }, ""],
    [{}, ""],
    [new URLSearchParams("q=%20gan%20"), " gan "],
  ])("reads %j as %j", (input, expected) => {
    expect(searchQueryParam(input)).toBe(expected);
  });
});
