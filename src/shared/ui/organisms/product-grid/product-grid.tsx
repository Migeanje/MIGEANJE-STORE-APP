import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import type { HeadingLevel } from "@/shared/ui/atoms/heading";
import {
  ProductCard,
  type ProductCardProps,
} from "@/shared/ui/molecules/product-card";

export type ProductGridColumns = 3 | 4;

const COLUMN_CLASSES = {
  // Next to a filters column (category page).
  3: "lg:grid-cols-3",
  // Full width (home, brand, search).
  4: "lg:grid-cols-4",
} as const satisfies Record<ProductGridColumns, string>;

export type ProductGridProps = Omit<ComponentProps<"ul">, "children"> & {
  products: readonly ProductCardProps[];
  /** Columns from `lg`: 4 at full width, 3 next to a filters column. Defaults to 4. */
  columns?: ProductGridColumns;
  /** Outline level of each product name. Defaults to 3. */
  headingLevel?: HeadingLevel;
};

/**
 * Responsive list of product cards: 1 column on phones, 2 from `sm`, 3 or 4
 * from `lg`. Renders nothing without products (the page shows its own empty
 * state).
 */
export function ProductGrid({
  products,
  columns = 4,
  headingLevel = 3,
  className,
  ...props
}: ProductGridProps) {
  if (products.length === 0) return null;
  return (
    <ul
      {...props}
      data-columns={columns}
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2",
        COLUMN_CLASSES[columns],
        className,
      )}
    >
      {products.map((product) => (
        <li key={String(product.href)}>
          <ProductCard {...product} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
