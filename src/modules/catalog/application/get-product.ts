import type { Availability } from "@/modules/catalog/domain/availability";
import {
  type Category,
  type ResolvedSpec,
  resolveSpecs,
} from "@/modules/catalog/domain/category";
import {
  type PriceSummary,
  type Product,
  productAvailability,
  productPrice,
} from "@/modules/catalog/domain/product";
import type { CatalogRepository } from "./catalog-repository";

export type ProductDetails = {
  product: Product;
  category: Category;
  /** Present specs with label and unit, in display order. */
  specs: ResolvedSpec[];
  price: PriceSummary;
  availability: Availability;
};

/**
 * The product page data, or null for an unknown slug (the route answers 404).
 * Throws when the product points to a missing category: that is a data bug.
 */
export async function getProduct(
  repository: CatalogRepository,
  slug: string,
): Promise<ProductDetails | null> {
  const product = await repository.getProductBySlug(slug);
  if (!product) return null;

  const categories = await repository.listCategories();
  const category = categories.find(
    ({ slug }) => slug === product.category.slug,
  );
  if (!category) {
    throw new Error(
      `Product "${product.slug}" points to the unknown category "${product.category.slug}"`,
    );
  }

  return {
    product,
    category,
    specs: resolveSpecs(product.specs, category),
    price: productPrice(product),
    availability: productAvailability(product),
  };
}
