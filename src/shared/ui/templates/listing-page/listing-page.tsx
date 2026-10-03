import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type ListingPageTemplateProps = {
  /** Small mono line above the title, e.g. "Categoría" or "Marca". */
  eyebrow?: string;
  /** The page's h1. */
  title: string;
  description?: ReactNode;
  /** Result count, e.g. "2 de 4 productos": a polite status, so a client-side filter change is announced. */
  count?: string;
  /** Filters column, from `lg` (e.g. `FilterPanel`). */
  aside?: ReactNode;
  /** Above the results: mobile filters, sort, active filters. */
  toolbar?: ReactNode;
  /** The results: grids, groups, empty states, pagination. */
  children: ReactNode;
};

/**
 * Layout of the listing pages (category, brand, search): a header with the
 * h1 and the result count, an optional filters column from `lg`, and the
 * toolbar above the results.
 */
export function ListingPageTemplate({
  eyebrow,
  title,
  description,
  count,
  aside,
  toolbar,
  children,
}: ListingPageTemplateProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:gap-12 lg:py-16">
      <header className="flex flex-col gap-3">
        {eyebrow ? (
          <Text mono size="body-sm" tone="muted">
            {eyebrow}
          </Text>
        ) : null}
        <Heading
          level={1}
          size="display-l"
          className="text-balance break-words"
        >
          {title}
        </Heading>
        {description ? (
          <div className="max-w-prose text-body text-pretty text-muted-foreground">
            {description}
          </div>
        ) : null}
        {count !== undefined ? (
          <p
            role="status"
            className="font-mono text-body-sm text-muted-foreground"
          >
            {count}
          </p>
        ) : null}
      </header>
      <div
        className={cn(
          aside
            ? "grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10"
            : "flex flex-col",
        )}
      >
        {aside ? <div className="min-w-0">{aside}</div> : null}
        <div className="flex min-w-0 flex-col gap-6">
          {toolbar ? (
            <div className="flex flex-col gap-4">{toolbar}</div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
