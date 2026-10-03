import type { Brand } from "@/modules/catalog/domain/brand";
import type { Category } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import type { CatalogRepository } from "./catalog-repository";

export type BrandProductGroup = { category: Category; products: Product[] };

export type BrandCatalog = {
  brand: Brand;
  /** In catalog category order; categories without the brand are left out. */
  groups: BrandProductGroup[];
  total: number;
};

/**
 * The brand page: the brand's products grouped by category (products in
 * catalog order). Null for an unknown brand (the route answers 404).
 */
export async function getBrandCatalog(
  repository: CatalogRepository,
  brandSlug: string,
): Promise<BrandCatalog | null> {
  const brands = await repository.listBrands();
  const brand = brands.find(({ slug }) => slug === brandSlug);
  if (!brand) return null;

  const [categories, products] = await Promise.all([
    repository.listCategories(),
    repository.listProducts({ brandSlug }),
  ]);
  const groups = categories.flatMap((category) => {
    const inCategory = products.items.filter(
      (product) => product.category.slug === category.slug,
    );
    return inCategory.length === 0 ? [] : [{ category, products: inCategory }];
  });
  return { brand, groups, total: products.total };
}
