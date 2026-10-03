import type { Product } from "@/modules/catalog/domain/product";
import type { CatalogRepository } from "./catalog-repository";

/**
 * The home page's "Destacados": products in stock (ready to ship), at most
 * `limit`. For variety it takes the first in-stock product of each category
 * (in catalog order) before filling with the rest in catalog order.
 * Throws a RangeError when `limit` is not a positive integer.
 */
export async function listFeaturedProducts(
  repository: CatalogRepository,
  limit: number,
): Promise<Product[]> {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }
  const [categories, inStock] = await Promise.all([
    repository.listCategories(),
    repository.listProducts({ filters: { availability: ["in_stock"] } }),
  ]);

  const firstPerCategory = categories.flatMap(
    ({ slug }) =>
      inStock.items.find((product) => product.category.slug === slug) ?? [],
  );
  const picked = new Set(firstPerCategory);
  const rest = inStock.items.filter((product) => !picked.has(product));
  return [...firstPerCategory, ...rest].slice(0, limit);
}
