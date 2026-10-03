import type { Category } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import type { CatalogRepository } from "./catalog-repository";

export const RELATED_PRODUCTS_LIMIT = 4;

export type RelatedProducts = {
  category: Category;
  /** Other products of the category, in "featured" order; may be empty. */
  products: Product[];
};

/**
 * The product page's "También te puede interesar": up to `limit` other
 * products of the same category. Throws a RangeError when `limit` is not a
 * positive integer, and an Error when the category is missing (a data bug).
 */
export async function listRelatedProducts(
  repository: CatalogRepository,
  product: Pick<Product, "slug" | "category">,
  limit: number = RELATED_PRODUCTS_LIMIT,
): Promise<RelatedProducts> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }
  const [categories, page] = await Promise.all([
    repository.listCategories(),
    repository.listProducts({ categorySlug: product.category.slug }),
  ]);
  const category = categories.find(
    ({ slug }) => slug === product.category.slug,
  );
  if (!category) {
    throw new Error(
      `Product "${product.slug}" points to the unknown category "${product.category.slug}"`,
    );
  }
  return {
    category,
    products: page.items
      .filter((candidate) => candidate.slug !== product.slug)
      .slice(0, limit),
  };
}
