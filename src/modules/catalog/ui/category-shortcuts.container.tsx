import Link from "next/link";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { buttonVariants } from "@/shared/ui/atoms/button";
import { loadCategoryLinks } from "./category-links";

const DEFAULT_HEADING_ID = "category-shortcuts";

export type CategoryShortcutsContainerProps = {
  /** Id of the heading; give another one when two can be on the page. */
  headingId?: string;
};

/**
 * Server Component: every catalog category as a pill link, for dead ends such
 * as the 404 page and the empty cart ("Explora por categoría").
 */
export async function CategoryShortcutsContainer({
  headingId = DEFAULT_HEADING_ID,
}: CategoryShortcutsContainerProps = {}) {
  const categories = await loadCategoryLinks(getCatalogRepository());
  return (
    <nav aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-body font-medium text-foreground">
        Explora por categoría
      </h2>
      <ul className="flex flex-wrap gap-2">
        {categories.map(({ slug, name }) => (
          <li key={slug}>
            <Link
              href={`/categorias/${slug}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
