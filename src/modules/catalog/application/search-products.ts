import type { Product } from "@/modules/catalog/domain/product";
import { searchTokens } from "@/modules/catalog/domain/search";
import type { CatalogRepository } from "./catalog-repository";

/** Longer queries are cut: it is input, so it is trimmed, never thrown. */
export const MAX_QUERY_LENGTH = 100;

export type SearchResult = {
  /** The query as searched: trimmed, single spaces, at most 100 characters. */
  query: string;
  products: Product[];
};

/** The query as searched: trimmed, single spaces, at most 100 characters. */
export function normalizeSearchQuery(rawQuery: string): string {
  return rawQuery.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH).trim();
}

/**
 * Searches name, model, brand, category and tags, ignoring case and accents.
 * A blank query returns no products without hitting the data source.
 */
export async function searchProducts(
  repository: CatalogRepository,
  rawQuery: string,
): Promise<SearchResult> {
  const query = normalizeSearchQuery(rawQuery);
  if (searchTokens(query).length === 0) return { query, products: [] };
  return { query, products: await repository.searchProducts(query) };
}
