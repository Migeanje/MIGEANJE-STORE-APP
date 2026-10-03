import { searchProducts } from "@/modules/catalog/application/search-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ProductGrid } from "@/shared/ui/organisms/product-grid";
import { ListingPageTemplate } from "@/shared/ui/templates/listing-page";
import { productCountLabel, searchTitle } from "./catalog-copy";
import { type SearchParamsInput, searchQueryParam } from "./catalog-url";
import { CategoryShortcutsContainer } from "./category-shortcuts.container";
import { toProductCardProps } from "./product-card-view";

/**
 * Server Component: the search results for `?q=` (first value, normalized by
 * the use case), echoed in the title, with the count and a grid. No results
 * or no query turn into category suggestions.
 */
export async function SearchPageContainer({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const repository = getCatalogRepository();
  const [{ query, products }, categories] = await Promise.all([
    searchProducts(repository, searchQueryParam(searchParams)),
    repository.listCategories(),
  ]);
  const categoriesBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const title = searchTitle(query);

  if (query === "") {
    return (
      <ListingPageTemplate
        eyebrow="Búsqueda"
        title={title}
        description="Escribe en el buscador qué necesitas: un producto, una marca o un modelo."
      >
        <CategoryShortcutsContainer />
      </ListingPageTemplate>
    );
  }

  return (
    <ListingPageTemplate
      eyebrow="Búsqueda"
      title={title}
      count={productCountLabel(products.length)}
    >
      {products.length > 0 ? (
        <ProductGrid
          products={products.map((product) =>
            toProductCardProps(
              product,
              categoriesBySlug.get(product.category.slug),
            ),
          )}
          headingLevel={2}
        />
      ) : (
        <div className="flex flex-col gap-12">
          <EmptyState
            title={`No encontramos resultados para «${query}»`}
            description="Revisa cómo lo escribiste o prueba con una palabra más general, como «cargador» o «cable». También puedes explorar por categoría."
          />
          <CategoryShortcutsContainer />
        </div>
      )}
    </ListingPageTemplate>
  );
}
