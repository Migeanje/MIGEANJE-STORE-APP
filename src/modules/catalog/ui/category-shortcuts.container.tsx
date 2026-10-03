import Link from "next/link";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { buttonVariants } from "@/shared/ui/atoms/button";
import { loadCategoryLinks } from "./category-links";

const HEADING_ID = "category-shortcuts";

/**
 * Server Component: every catalog category as a pill link, for dead ends such
 * as the 404 page ("Explora por categoría").
 */
export async function CategoryShortcutsContainer() {
  const categories = await loadCategoryLinks(getCatalogRepository());
  return (
    <nav aria-labelledby={HEADING_ID} className="flex flex-col gap-4">
      <h2 id={HEADING_ID} className="text-body font-medium text-foreground">
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
