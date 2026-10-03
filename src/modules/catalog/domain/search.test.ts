// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildTestCatalog } from "@/modules/catalog/testing/catalog-builders";
import { matchesSearch, normalizeSearchText, searchTokens } from "./search";

const { products } = buildTestCatalog();

function search(query: string): string[] {
  const tokens = searchTokens(query);
  return products
    .filter((product) => matchesSearch(product, tokens))
    .map((product) => product.slug);
}

describe("normalizeSearchText", () => {
  it("lowercases, strips accents and collapses whitespace", () => {
    expect(normalizeSearchText("  Cárgador   RÁPIDO\tÑandú ")).toBe(
      "cargador rapido nandu",
    );
  });
});

describe("searchTokens", () => {
  it("splits the normalized query into words", () => {
    expect(searchTokens(" Anker  Nano ")).toEqual(["anker", "nano"]);
    expect(searchTokens("   ")).toEqual([]);
  });
});

describe("matchesSearch", () => {
  it("matches the name ignoring case and accents", () => {
    expect(search("cargador basico")).toEqual(["cargador-basico-20w"]);
  });

  it("matches the brand name", () => {
    expect(search("ÚGREEN")).toEqual(["nexode-65w", "cargador-basico-20w"]);
  });

  it("matches the category name", () => {
    expect(search("cargadores")).toEqual([
      "nano-45w",
      "prime-100w",
      "nexode-65w",
      "cargador-basico-20w",
    ]);
  });

  it("matches tags and the model number", () => {
    expect(search("rapida")).toEqual(["nano-45w"]);
    expect(search("trenzado")).toEqual(["cable-usb-c-1m"]);
    expect(search("a121d")).toEqual(["nano-45w"]);
  });

  it("requires every word to match somewhere", () => {
    expect(search("anker 100w")).toEqual(["prime-100w"]);
    expect(search("anker lightning")).toEqual([]);
  });

  it("matches nothing without words", () => {
    expect(search("")).toEqual([]);
  });
});
