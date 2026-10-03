import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/atoms/button";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import {
  ProductGrid,
  type ProductGridColumns,
} from "@/shared/ui/organisms/product-grid";

export type ProductSectionProps = Omit<
  ComponentProps<"section">,
  "children" | "title"
> & {
  title: string;
  products: readonly ProductCardProps[];
  /** "See more" link next to the title, e.g. the category filtered by brand. */
  action?: { href: string; label: string };
  /** Outline level of the title; product names sit one level below. Defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5;
  columns?: ProductGridColumns;
};

/** A titled group of product cards (e.g. one category on a brand page). */
export function ProductSection({
  title,
  products,
  action,
  headingLevel = 2,
  columns = 4,
  className,
  ...props
}: ProductSectionProps) {
  const headingId = useId();
  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Heading id={headingId} level={headingLevel}>
          {title}
        </Heading>
        {action ? (
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-mx-4",
            )}
          >
            {action.label}
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <ProductGrid
        products={products}
        columns={columns}
        headingLevel={(headingLevel + 1) as HeadingLevel}
      />
    </section>
  );
}
