import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";

export type CompareBarProps = Omit<ComponentProps<"section">, "children"> & {
  /** The products in the tray, in order. `key` is unique (e.g. the slug). */
  items: readonly { key: string; name: string }[];
  /** Their category, e.g. "Cargadores". */
  categoryName?: string;
  /** The most products the tray holds. */
  max: number;
  /** The comparator URL, or null while there are fewer than 2 products. */
  compareHref: string | null;
  /** Empties the tray. */
  onClear: () => void;
};

/**
 * The compare tray as a bar stuck to the bottom of the viewport: how many
 * products are picked (and which, from `lg`), "Vaciar" and the "Comparar (n)"
 * link, or a hint while only one is picked. A region named "Comparación";
 * renders nothing when the tray is empty.
 */
export function CompareBar({
  items,
  categoryName,
  max,
  compareHref,
  onClear,
  className,
  ...props
}: CompareBarProps) {
  if (items.length === 0) return null;
  const count = items.length;

  return (
    <section
      {...props}
      aria-label="Comparación"
      className={cn(
        "sticky bottom-0 z-30 border-t bg-card/95 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-8">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-body-sm font-medium text-foreground">
            {count} de {max} para comparar
            {categoryName ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                · {categoryName}
              </span>
            ) : null}
          </p>
          <ul className="hidden min-w-0 gap-x-3 text-caption text-muted-foreground lg:flex">
            {items.map((item) => (
              <li key={item.key} className="truncate">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Vaciar
          </Button>
          {compareHref ? (
            <Button asChild size="sm" trailingIcon={<ArrowRight />}>
              <Link href={compareHref}>Comparar ({count})</Link>
            </Button>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              Agrega otro producto para comparar
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
