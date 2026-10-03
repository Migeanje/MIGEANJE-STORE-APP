import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategoryProducts } from "@/modules/catalog/application/list-category-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { Button } from "@/shared/ui/atoms/button";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ActiveFilters } from "@/shared/ui/organisms/active-filters";
import { Pagination } from "@/shared/ui/organisms/pagination";
import { ProductGrid } from "@/shared/ui/organisms/product-grid";
import { ListingPageTemplate } from "@/shared/ui/templates/listing-page";
import {
  parseCategorySearchParams,
  type SearchParamsInput,
} from "./catalog-url";
import { CategoryFilters, CategorySort } from "./category-controls";
import {
  buildCategoryPageView,
  CATEGORY_PAGE_SIZE,
} from "./category-page.view";

export type CategoryPageContainerProps = {
  slug: string;
  /** The page's `searchParams`: untrusted, sanitized here. */
  searchParams: SearchParamsInput;
};

/**
 * Server Component: the category page. Reads the URL into a query (unknown
 * and invalid params dropped), lists the filtered, sorted and paginated
 * products, and renders the filters (native GET forms enhanced with client
 * navigation), the active filter chips, the grid, the page links and the
 * empty states. Unknown categories answer 404.
 */
export async function CategoryPageContainer({
  slug,
  searchParams,
}: CategoryPageContainerProps) {
  const repository = getCatalogRepository();
  const category = (await repository.listCategories()).find(
    (entry) => entry.slug === slug,
  );
  if (!category) notFound();

  const query = parseCategorySearchParams(searchParams, category);
  const listing = await listCategoryProducts(repository, slug, {
    filters: query.filters,
    sort: query.sort,
    pagination: { page: query.page, pageSize: CATEGORY_PAGE_SIZE },
  });
  if (!listing) notFound();

  const view = buildCategoryPageView(listing, query.sort);
  // Remount the uncontrolled forms whenever the URL changes, so their fields
  // follow it (e.g. after removing a chip).
  const formKey = view.canonicalHref;
  const filterProps = {
    category,
    groups: view.filterGroups,
    hiddenFields: view.filterHiddenFields,
    activeCount: view.activeCount,
    clearHref: view.clearHref,
  };

  return (
    <ListingPageTemplate
      eyebrow="Categoría"
      title={category.name}
      count={view.count}
      aside={<CategoryFilters key={formKey} variant="panel" {...filterProps} />}
      toolbar={
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CategoryFilters key={formKey} variant="sheet" {...filterProps} />
            <CategorySort
              key={formKey}
              category={category}
              {...view.sort}
              className="ml-auto"
            />
          </div>
          <ActiveFilters
            filters={view.activeFilters}
            clearHref={view.clearHref}
          />
        </>
      }
    >
      {view.products.length > 0 ? (
        <>
          <ProductGrid products={view.products} columns={3} headingLevel={2} />
          <Pagination
            page={view.pagination.page}
            pageCount={view.pagination.pageCount}
            hrefForPage={view.hrefForPage}
          />
        </>
      ) : listing.categoryTotal === 0 ? (
        <EmptyState
          title="Pronto tendremos productos aquí"
          description="Todavía no hay productos en esta categoría. Mientras tanto, explora las demás."
        >
          <Button asChild variant="secondary">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </EmptyState>
      ) : (
        <EmptyState
          title="No hay productos con estos filtros"
          description="Prueba quitando alguno de los filtros para ver más opciones."
        >
          <Button asChild>
            <Link href={view.clearHref} scroll={false}>
              Quitar filtros
            </Link>
          </Button>
        </EmptyState>
      )}
    </ListingPageTemplate>
  );
}
