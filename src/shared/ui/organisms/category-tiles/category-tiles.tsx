import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type CategoryTile = {
  /** Category page, e.g. "/categorias/cargadores". */
  href: string;
  name: string;
  /** Short data line under the name, e.g. "4 productos". */
  meta: string;
};

export type CategoryTilesProps = Omit<ComponentProps<"ul">, "children"> & {
  categories: readonly CategoryTile[];
};

/**
 * Typographic category tiles (no images): name and a mono data line on a
 * card. "Encendido": a warm glow and an amber arrow light up on hover and
 * keyboard focus. Each tile is one link named by its text.
 */
export function CategoryTiles({
  categories,
  className,
  ...props
}: CategoryTilesProps) {
  return (
    <ul
      {...props}
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4",
        className,
      )}
    >
      {categories.map(({ href, name, meta }) => (
        <li key={href}>
          <Link
            href={href}
            className={cn(
              "group relative flex h-full min-h-28 flex-col justify-between gap-6 overflow-hidden rounded-lg border bg-card p-4 sm:min-h-36 sm:p-6",
              "transition-[border-color] duration-(--duration-fast) ease-out hover:border-input focus-visible:border-input",
            )}
          >
            <span
              data-slot="glow"
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -right-1/4 -bottom-1/2 size-full bg-radial-[closest-side] from-primary/30 to-transparent",
                "opacity-0 transition-opacity duration-(--duration-fast) ease-out group-hover:opacity-100 group-focus-visible:opacity-100",
              )}
            />
            <span className="relative flex items-start justify-between gap-2">
              <span className="text-body font-medium text-foreground sm:text-title">
                {name}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex text-muted-foreground transition-colors duration-(--duration-fast) ease-out group-hover:text-primary group-focus-visible:text-primary"
              >
                <ArrowUpRight className="size-5" />
              </span>
            </span>
            {/* A space keeps "Cargadores 4 productos" as two words in the name. */}{" "}
            <span className="relative font-mono text-caption text-muted-foreground">
              {meta}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
