import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/atoms/button";

export type PageItem = number | "gap";

/** Pages are listed in full up to this count; above it, gaps appear. */
const MAX_FULL = 7;

/**
 * The page links to show: every page when there are few, otherwise the
 * first, the last and the current page with its neighbors, with gaps.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= MAX_FULL) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const shown = [1, page - 1, page, page + 1, pageCount]
    .filter((entry) => entry >= 1 && entry <= pageCount)
    .filter((entry, index, all) => all.indexOf(entry) === index)
    .sort((a, b) => a - b);
  const items: PageItem[] = [];
  for (const entry of shown) {
    const previous = items.at(-1);
    if (typeof previous === "number" && entry - previous > 1) {
      items.push(entry - previous === 2 ? previous + 1 : "gap");
    }
    items.push(entry);
  }
  return items;
}

export type PaginationProps = Omit<ComponentProps<"nav">, "children"> & {
  /** Current page, 1-based. */
  page: number;
  pageCount: number;
  /** URL of a page (1-based). */
  hrefForPage: (page: number) => string;
};

const linkClasses = buttonVariants({ variant: "ghost", size: "md" });

/**
 * Page links in a "Paginación" navigation: previous, numbered pages (the
 * current one with `aria-current="page"`, lit in amber) and next. Renders
 * nothing for a single page. Throws a RangeError for a page outside
 * 1..pageCount or a non-positive page count.
 */
export function Pagination({
  page,
  pageCount,
  hrefForPage,
  className,
  ...props
}: PaginationProps) {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1) {
    throw new RangeError(
      `pageCount must be a positive integer, got ${pageCount}`,
    );
  }
  if (!Number.isSafeInteger(page) || page < 1 || page > pageCount) {
    throw new RangeError(
      `page must be an integer from 1 to ${pageCount}, got ${page}`,
    );
  }
  if (pageCount === 1) return null;

  return (
    <nav
      aria-label="Paginación"
      {...props}
      className={cn("flex justify-center", className)}
    >
      <ul className="flex flex-wrap items-center gap-1">
        {page > 1 ? (
          <li>
            <Link
              href={hrefForPage(page - 1)}
              className={cn(linkClasses, "px-3")}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              <span className="sr-only">Página anterior</span>
            </Link>
          </li>
        ) : null}
        {pageItems(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <li
              // Gaps have no identity of their own: their position is stable.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-2 font-mono text-body-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefForPage(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  linkClasses,
                  "w-11 px-0 font-mono",
                  "aria-[current=page]:border aria-[current=page]:border-primary aria-[current=page]:text-primary aria-[current=page]:shadow-glow",
                )}
              >
                {/* The space is a plain text node: name computation trims spans. */}
                <span className="sr-only">Página</span> {item}
              </Link>
            </li>
          ),
        )}
        {page < pageCount ? (
          <li>
            <Link
              href={hrefForPage(page + 1)}
              className={cn(linkClasses, "px-3")}
            >
              <span className="sr-only">Página siguiente</span>
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
