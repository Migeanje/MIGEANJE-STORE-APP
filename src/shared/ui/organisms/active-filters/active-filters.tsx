"use client";

// A Client Component because it reuses `chipClassName` from the Chip atom, a
// client module: a Server Component would get a client reference, not the
// string.
import { X } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/atoms/button";
import { chipClassName } from "@/shared/ui/atoms/chip";

export type ActiveFilter = {
  /** What is filtered, e.g. "Anker" or "Potencia máxima: 60–140 W". */
  label: string;
  /** The same listing without this filter. */
  removeHref: string;
};

export type ActiveFiltersProps = Omit<ComponentProps<"div">, "children"> & {
  filters: readonly ActiveFilter[];
  /** The listing without any filter. */
  clearHref: string;
};

/**
 * The applied filters as removable chips (each a link to the listing without
 * it, named "Quitar filtro: …") plus "Quitar filtros". Links work without
 * JavaScript and navigate on the client once hydrated. Renders nothing when
 * no filter is active.
 */
export function ActiveFilters({
  filters,
  clearHref,
  className,
  ...props
}: ActiveFiltersProps) {
  const labelId = useId();
  if (filters.length === 0) return null;
  return (
    <div
      {...props}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <span id={labelId} className="sr-only">
        Filtros activos
      </span>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {filters.map(({ label, removeHref }) => (
          <li key={removeHref}>
            <Link
              href={removeHref}
              scroll={false}
              className={cn(chipClassName, "max-w-full whitespace-normal")}
            >
              {/* The space is a plain text node: name computation trims spans. */}
              <span className="sr-only">Quitar filtro:</span> {label}
              <X aria-hidden="true" className="text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={clearHref}
        scroll={false}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Quitar filtros
      </Link>
    </div>
  );
}
