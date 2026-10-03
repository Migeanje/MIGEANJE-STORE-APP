import type { Product } from "./product";

/** Lowercase, without accents (á -> a, ñ -> n) and with single spaces. */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** The normalized words of a query; empty when there is nothing to search. */
export function searchTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  return normalized === "" ? [] : normalized.split(" ");
}

/**
 * True when every token appears in the product's name, model, brand, category
 * or tags. Partial words match ("carga" finds "cargador").
 */
export function matchesSearch(
  product: Product,
  tokens: readonly string[],
): boolean {
  if (tokens.length === 0) return false;
  const haystack = normalizeSearchText(
    [
      product.name,
      product.model ?? "",
      product.brand.name,
      product.category.name,
      ...product.tags,
    ].join(" "),
  );
  return tokens.every((token) => haystack.includes(token));
}
