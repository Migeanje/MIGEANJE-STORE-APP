// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildTestCatalog,
  CHARGERS,
} from "@/modules/catalog/testing/catalog-builders";
import { computeFacets } from "./facets";

const chargers = buildTestCatalog().products.filter(
  (product) => product.category.slug === "cargadores",
);

describe("computeFacets", () => {
  it("builds one facet per filterable spec, in schema order", () => {
    const { specs } = computeFacets(chargers, CHARGERS);

    expect(specs).toEqual([
      {
        kind: "range",
        key: "maxPower",
        label: "Potencia máxima",
        unit: "W",
        min: 20,
        max: 100,
      },
      {
        kind: "options",
        key: "ports",
        label: "Puertos",
        options: [
          { value: "USB-A", label: "USB-A", count: 2 },
          { value: "USB-C", label: "USB-C", count: 4 },
        ],
      },
      {
        kind: "options",
        key: "technology",
        label: "Tecnología",
        options: [
          { value: "GaN", label: "GaN", count: 3 },
          { value: "Silicio", label: "Silicio", count: 1 },
        ],
      },
      { kind: "toggle", key: "display", label: "Pantalla", count: 1 },
    ]);
  });

  it("lists the brands with their product counts, by name", () => {
    expect(computeFacets(chargers, CHARGERS).brands).toEqual([
      { value: "anker", label: "Anker", count: 2 },
      { value: "ugreen", label: "UGREEN", count: 2 },
    ]);
  });

  it("omits facets that no product can match", () => {
    const withoutValues = chargers.map((product) => ({
      ...product,
      specs: { technology: "GaN" },
    }));

    expect(
      computeFacets(withoutValues, CHARGERS).specs.map((facet) => facet.key),
    ).toEqual(["technology"]);
  });

  it("returns no facets for an empty category", () => {
    expect(computeFacets([], CHARGERS)).toEqual({ brands: [], specs: [] });
  });
});
