import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";

/** What navigation needs from a category: no spec schema in the payload. */
export type CategoryLink = {
  slug: string;
  name: string;
};

/** The catalog categories, in catalog order, as navigation entries. */
export async function loadCategoryLinks(
  repository: CatalogRepository,
): Promise<CategoryLink[]> {
  const categories = await repository.listCategories();
  return categories.map(({ slug, name }) => ({ slug, name }));
}
