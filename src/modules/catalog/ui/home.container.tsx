import { listCategorySummaries } from "@/modules/catalog/application/list-category-summaries";
import { listFeaturedProducts } from "@/modules/catalog/application/list-featured-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { HomePageTemplate } from "@/shared/ui/templates/home-page";
import { productCountLabel } from "./catalog-copy";
import { categoryPath, SEARCH_PATH } from "./catalog-url";
import { toProductCardProps } from "./product-card-view";

/** "Destacados" on the home page. */
export const FEATURED_COUNT = 6;

/**
 * Server Component: the home page with the featured in-stock products and
 * every category with its product count. The hero points to the first
 * category.
 */
export async function HomeContainer() {
  const repository = getCatalogRepository();
  const [categories, summaries, featured] = await Promise.all([
    repository.listCategories(),
    listCategorySummaries(repository),
    listFeaturedProducts(repository, FEATURED_COUNT),
  ]);
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const [first] = summaries;

  return (
    <HomePageTemplate
      heroCta={
        first
          ? {
              href: categoryPath(first.slug),
              label: `Ver ${first.name.toLocaleLowerCase("es-PE")}`,
            }
          : { href: SEARCH_PATH, label: "Buscar productos" }
      }
      featured={featured.map((product) =>
        toProductCardProps(
          product,
          categoriesBySlug.get(product.category.slug),
        ),
      )}
      categories={summaries.map(({ slug, name, productCount }) => ({
        href: categoryPath(slug),
        name,
        meta: productCountLabel(productCount),
      }))}
    />
  );
}
