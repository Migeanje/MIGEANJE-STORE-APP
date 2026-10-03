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
  /**
   * The filters actually applied: unsupported or malformed ones, and brands
   * or option values no product of the category has, are dropped.
   */
  filters: ProductFilters;
  results: ProductPage;
  /** Products in the category before filtering ("2 de 4 productos"). */
  categoryTotal: number;
};

/**
 * The category page: its products filtered, sorted and paginated, plus the
 * facets built from the category spec schema. Null for an unknown category
 * (the route answers 404). Filters come from the URL: they are sanitized
 * against the category and its facets, never thrown.
 */
export async function listCategoryProducts(
  repository: CatalogRepository,
  categorySlug: string,
  { filters = {}, sort = "featured", pagination }: CategoryListingOptions = {},
): Promise<CategoryListing | null> {
  const categories = await repository.listCategories();
  const category = categories.find(({ slug }) => slug === categorySlug);
  if (!category) return null;

  // The facets are the known values the filters are checked against.
  const all = await repository.listProducts({ categorySlug });
  const facets = computeFacets(all.items, category);
  const applied = sanitizeFilters(filters, category, facets);
  const results = await repository.listProducts({
    categorySlug,
    filters: applied,
    sort,
    pagination,
  });

  return {
    category,
    facets,
    filters: applied,
    results,
    categoryTotal: all.total,
  };
}
