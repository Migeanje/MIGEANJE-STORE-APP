import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";
import type { Catalog } from "@/modules/catalog/domain/catalog";
import {
  filterProducts,
  paginate,
  sortProducts,
} from "@/modules/catalog/domain/product-query";
import { matchesSearch, searchTokens } from "@/modules/catalog/domain/search";
import { deepFreeze } from "./deep-freeze";

/**
 * A `CatalogRepository` over an in-memory catalog. The mock adapter uses it
 * with the parsed fixtures; tests use it with small hand-written catalogs.
 * Filtering, sorting and search reuse the domain functions, so a future
 * Medusa adapter has a reference for the expected semantics.
 *
 * It serves a deeply frozen copy of `catalog`: the repository lives for the
 * whole process, so returned entities are shared by every request. Mutating
 * one throws a TypeError, and later changes to `catalog` do not leak in.
 */
export function createInMemoryCatalogRepository(
  catalog: Catalog,
): CatalogRepository {
  const { categories, brands, products } = deepFreeze(structuredClone(catalog));

  return {
    async listCategories() {
      return categories;
    },

    async listBrands() {
      return brands;
    },

    async listProducts(query = {}) {
      const {
        categorySlug,
        brandSlug,
        filters = {},
        sort = "featured",
      } = query;
      const scoped = products.filter(
        (product) =>
          (categorySlug === undefined ||
            product.category.slug === categorySlug) &&
          (brandSlug === undefined || product.brand.slug === brandSlug),
      );
      return paginate(
        sortProducts(filterProducts(scoped, filters), sort),
        query.pagination,
      );
    },

    async getProductBySlug(slug) {
      return products.find((product) => product.slug === slug) ?? null;
    },

    async getProductsBySlugs(slugs) {
      return slugs.flatMap(
        (slug) => products.find((product) => product.slug === slug) ?? [],
      );
    },

    async searchProducts(text) {
      const tokens = searchTokens(text);
      return products.filter((product) => matchesSearch(product, tokens));
    },
  };
}
