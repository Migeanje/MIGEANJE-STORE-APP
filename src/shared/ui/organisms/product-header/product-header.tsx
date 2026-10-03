import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

const TEXT_LINK =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export type ProductHeaderProps = Omit<
  ComponentProps<"header">,
  "children" | "title"
> & {
  /** Brand as plain descriptive text (never a logo), linking to its page. */
  brand: { name: string; href: string };
  /** The product name: the page's h1. */
  name: string;
  /** Manufacturer model number, in Geist Mono. */
  model?: string;
  /** One or two sentences. */
  summary: string;
  /** Category eyebrow above the brand, linking to the category. */
  category?: { name: string; href: string };
};

/**
 * Top of the product page: category and brand links, the name as the h1,
 * the model number (data, so Geist Mono) and the summary.
 */
export function ProductHeader({
  brand,
  name,
  model,
  summary,
  category,
  className,
  ...props
}: ProductHeaderProps) {
  return (
    <header {...props} className={cn("flex flex-col gap-3", className)}>
      <p className="flex flex-wrap items-center gap-x-2 text-body-sm">
        {category ? (
          <>
            <Link
              href={category.href}
              className={cn(TEXT_LINK, "font-mono text-muted-foreground")}
            >
              {category.name}
            </Link>
            <span aria-hidden="true" className="text-muted-foreground">
              /
            </span>
          </>
        ) : null}
        <Link
          href={brand.href}
          className={cn(TEXT_LINK, "font-medium text-foreground")}
        >
          {brand.name}
          <span className="sr-only">: ver todos sus productos</span>
        </Link>
      </p>
      <Heading level={1} size="display-l" className="text-balance break-words">
        {name}
      </Heading>
      {model ? (
        <Text mono size="body-sm" tone="muted">
          Modelo {model}
        </Text>
      ) : null}
      <Text tone="muted" className="max-w-prose text-pretty">
        {summary}
      </Text>
    </header>
  );
}
