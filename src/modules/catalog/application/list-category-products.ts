import type { Category } from "@/modules/catalog/domain/category";
import {
  type CategoryFacets,
  computeFacets,
} from "@/modules/catalog/domain/facets";
import {
  type Pagination,
  type ProductFilters,
  type ProductPage,
  type ProductSort,
  sanitizeFilters,
} from "@/modules/catalog/domain/product-query";
import type { CatalogRepository } from "./catalog-repository";

export type CategoryListingOptions = {
  filters?: ProductFilters;
  sort?: ProductSort;
  pagination?: Pagination;
};

export type CategoryListing = {
  category: Category;
  /** From every product in the category, so options never vanish. */
  facets: CategoryFacets;
  /** The filters actually applied (unsupported ones are dropped). */
  filters: ProductFilters;
  results: ProductPage;
};

/**
 * The category page: its products filtered, sorted and paginated, plus the
 * facets built from the category spec schema. Null for an unknown category
 * (the route answers 404).
 */
export async function listCategoryProducts(
  repository: CatalogRepository,
  categorySlug: string,
  { filters = {}, sort = "featured", pagination }: CategoryListingOptions = {},
): Promise<CategoryListing | null> {
  const categories = await repository.listCategories();
  const category = categories.find(({ slug }) => slug === categorySlug);
  if (!category) return null;

  const applied = sanitizeFilters(filters, category);
  const [all, results] = await Promise.all([
    repository.listProducts({ categorySlug }),
    repository.listProducts({
      categorySlug,
      filters: applied,
      sort,
      pagination,
    }),
  ]);

  return {
    category,
    facets: computeFacets(all.items, category),
    filters: applied,
    results,
  };
}
