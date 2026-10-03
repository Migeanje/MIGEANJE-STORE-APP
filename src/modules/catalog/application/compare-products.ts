import {
  type Category,
  orderedSpecs,
  type SpecKind,
  type SpecValue,
} from "@/modules/catalog/domain/category";
import { duplicates } from "@/modules/catalog/domain/primitives";
import type { Product } from "@/modules/catalog/domain/product";
import type { CatalogRepository } from "./catalog-repository";

export const MIN_COMPARED = 2;
export const MAX_COMPARED = 4;

export type ComparisonErrorReason =
  | "count"
  | "duplicate"
  | "not_found"
  | "mixed_categories"
  | "category_not_found";

/**
 * A comparison that cannot be built. The slugs come from the URL, so the page
 * catches it and maps `reason` to customer copy. `category_not_found` is not
 * the customer's fault: the data source lists products of a category it does
 * not return.
 */
export class ProductComparisonError extends Error {
  readonly reason: ComparisonErrorReason;

  constructor(reason: ComparisonErrorReason, message: string) {
    super(message);
    this.name = "ProductComparisonError";
    this.reason = reason;
  }
}

export type ComparisonRow = {
  key: string;
  label: string;
  unit?: string;
  kind: SpecKind;
  /** One value per compared product, in order; null when it lacks the spec. */
  values: (SpecValue | null)[];
  /** True when not every product has the same value. */
  differs: boolean;
};

export type ProductComparison = {
  category: Category;
  products: Product[];
  rows: ComparisonRow[];
};

/**
 * Compares 2 to 4 distinct products of one category, in the given order: one
 * row per comparable spec that at least one of them has. Throws a
 * ProductComparisonError otherwise.
 */
export async function compareProducts(
  repository: CatalogRepository,
  slugs: readonly string[],
): Promise<ProductComparison> {
  if (slugs.length < MIN_COMPARED || slugs.length > MAX_COMPARED) {
    throw new ProductComparisonError(
      "count",
      `Compare from ${MIN_COMPARED} to ${MAX_COMPARED} products, got ${slugs.length}`,
    );
  }
  const repeated = duplicates(slugs);
  if (repeated.length > 0) {
    throw new ProductComparisonError(
      "duplicate",
      `Each product can be compared once: ${repeated.join(", ")}`,
    );
  }

  const products = await repository.getProductsBySlugs(slugs);
  const found = new Set(products.map((product) => product.slug));
  const missing = slugs.filter((slug) => !found.has(slug));
  if (missing.length > 0) {
    throw new ProductComparisonError(
      "not_found",
      `Unknown products: ${missing.map((slug) => `"${slug}"`).join(", ")}`,
    );
  }

  const categorySlugs = [
    ...new Set(products.map((product) => product.category.slug)),
  ];
  if (categorySlugs.length > 1) {
    throw new ProductComparisonError(
      "mixed_categories",
      `Products from different categories cannot be compared: ${categorySlugs.join(", ")}`,
    );
  }

  const categories = await repository.listCategories();
  const category = categories.find(({ slug }) => slug === categorySlugs[0]);
  if (!category) {
    throw new ProductComparisonError(
      "category_not_found",
      `Unknown category "${categorySlugs[0]}"`,
    );
  }

  const rows = orderedSpecs(category)
    .filter((definition) => definition.comparable)
    .flatMap(({ key, label, unit, kind }): ComparisonRow[] => {
      const values = products.map((product) => product.specs[key] ?? null);
      if (values.every((value) => value === null)) return [];
      // Values are JSON primitives or string lists: compare their JSON.
      const first = JSON.stringify(values[0]);
      const differs = values.some((value) => JSON.stringify(value) !== first);
      return [{ key, label, unit, kind, values, differs }];
    });

  return { category, products, rows };
}
