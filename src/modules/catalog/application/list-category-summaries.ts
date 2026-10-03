import type { CatalogRepository } from "./catalog-repository";

export type CategorySummary = {
  slug: string;
  name: string;
  productCount: number;
};

/** Every category in catalog order with how many products it has. */
export async function listCategorySummaries(
  repository: CatalogRepository,
): Promise<CategorySummary[]> {
  const [categories, products] = await Promise.all([
    repository.listCategories(),
    repository.listProducts(),
  ]);
  const counts = new Map<string, number>();
  for (const product of products.items) {
    const slug = product.category.slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return categories.map(({ slug, name }) => ({
    slug,
    name,
    productCount: counts.get(slug) ?? 0,
  }));
}
