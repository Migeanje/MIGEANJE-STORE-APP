// Listing cards of given products, for other modules' pages (the account's
// favorites: the /cuenta/favoritos route passes `findProductCards` in).
// Server-only: it reads the catalog repository.
import "server-only";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import { toProductCardProps } from "./product-card-view";

export type ProductCardEntry = { slug: string; card: ProductCardProps };

/**
 * The listing card of each product, in the requested order; slugs that are
 * not (or no longer) in the catalog are skipped.
 */
export async function findProductCards(
  slugs: readonly string[],
): Promise<ProductCardEntry[]> {
  if (slugs.length === 0) return [];
  const repository = getCatalogRepository();
  const [products, categories] = await Promise.all([
    repository.getProductsBySlugs(slugs),
    repository.listCategories(),
  ]);
  return products.map((product) => ({
    slug: product.slug,
    card: toProductCardProps(
      product,
      categories.find(({ slug }) => slug === product.category.slug),
    ),
  }));
}
