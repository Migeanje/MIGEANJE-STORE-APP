import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";
import { type Catalog, parseCatalog } from "@/modules/catalog/domain/catalog";
import { deepFreeze } from "./deep-freeze";
import { catalogFixtures } from "./fixtures";
import { createInMemoryCatalogRepository } from "./in-memory-catalog-repository";

/**
 * The fixtures, validated with the domain Zod schemas when this module loads:
 * a broken fixture fails loudly at startup instead of rendering bad data.
 * Deeply frozen, since every importer shares it.
 */
export const mockCatalog: Catalog = deepFreeze(parseCatalog(catalogFixtures));

/** `DATA_SOURCE=mock`: the catalog port served from the fixtures. */
export function createMockCatalogRepository(): CatalogRepository {
  return createInMemoryCatalogRepository(mockCatalog);
}
