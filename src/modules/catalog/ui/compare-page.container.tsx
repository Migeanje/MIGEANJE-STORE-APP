import Link from "next/link";
import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";
import {
  compareProducts,
  MAX_COMPARED,
  type ProductComparison,
  ProductComparisonError,
} from "@/modules/catalog/application/compare-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { buttonVariants } from "@/shared/ui/atoms/button";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ComparisonTable } from "@/shared/ui/organisms/comparison-table";
import { ListingPageTemplate } from "@/shared/ui/templates/listing-page";
import {
  compareSlugsParam,
  differencesOnlyParam,
  type SearchParamsInput,
} from "./catalog-url";
import { CategoryShortcutsContainer } from "./category-shortcuts.container";
import {
  buildComparisonProblemView,
  buildComparisonView,
  type ComparisonProblemView,
} from "./compare-page.view";
import { CompareTraySync } from "./compare-tray-sync";

const EYEBROW = "Comparador";

type Outcome =
  | { kind: "comparison"; comparison: ProductComparison }
  | { kind: "problem"; problem: ComparisonProblemView };

/** The comparison, or the friendly state for why it cannot be built. */
async function compareOrExplain(
  repository: CatalogRepository,
  slugs: readonly string[],
): Promise<Outcome> {
  try {
    return {
      kind: "comparison",
      comparison: await compareProducts(repository, slugs),
    };
  } catch (error) {
    if (!(error instanceof ProductComparisonError)) throw error;
    const found = await repository.getProductsBySlugs(slugs);
    return {
      kind: "problem",
      problem: buildComparisonProblemView({
        reason: error.reason,
        slugs,
        found,
      }),
    };
  }
}

/**
 * Server Component: the comparator, `/comparar?productos=a,b,c`. Compares 2
 * to 4 products of one category side by side; `diferencias=si` keeps only the
 * rows that differ (a link, so it works without JavaScript). Every reason a
 * comparison cannot be built is a friendly state with next steps.
 */
export async function ComparePageContainer({
  searchParams,
}: {
  searchParams: SearchParamsInput;
}) {
  const outcome = await compareOrExplain(
    getCatalogRepository(),
    compareSlugsParam(searchParams),
  );

  if (outcome.kind === "problem") {
    const { problem } = outcome;
    return (
      <ListingPageTemplate eyebrow={EYEBROW} title="Comparar productos">
        <div className="flex flex-col gap-12">
          <EmptyState title={problem.title} description={problem.description}>
            {problem.actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={buttonVariants({
                  variant: index === 0 ? "primary" : "secondary",
                })}
              >
                {action.label}
              </Link>
            ))}
          </EmptyState>
          {problem.showCategories ? <CategoryShortcutsContainer /> : null}
        </div>
      </ListingPageTemplate>
    );
  }

  const { comparison } = outcome;
  const view = buildComparisonView(
    comparison,
    differencesOnlyParam(searchParams),
  );
  const category = {
    slug: comparison.category.slug,
    name: comparison.category.name,
  };
  return (
    <ListingPageTemplate
      eyebrow={EYEBROW}
      title={view.title}
      count={view.rowsLabel}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={view.toggle.href}
            scroll={false}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            {view.toggle.label}
          </Link>
          {view.columns.length < MAX_COMPARED ? (
            <Link
              href={view.categoryHref}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Agregar otro producto
            </Link>
          ) : null}
        </div>
      }
    >
      <CompareTraySync
        items={comparison.products.map(({ slug, name }) => ({
          slug,
          name,
          category,
        }))}
      />
      <ComparisonTable
        caption={`Comparación de ${view.columns.length} productos`}
        products={view.columns.map(({ slug, ...column }) => ({
          key: slug,
          ...column,
        }))}
        rows={view.rows}
      />
    </ListingPageTemplate>
  );
}
