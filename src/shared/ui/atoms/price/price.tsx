import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { assertMinorUnits, formatPEN } from "@/shared/lib/money";

const amountVariants = cva("font-medium text-foreground", {
  variants: {
    size: {
      sm: "text-body-sm",
      md: "text-body",
      lg: "text-title",
    },
  },
  defaultVariants: { size: "md" },
});

// The previous price sits one step below the current one.
const compareAtVariants = cva("text-muted-foreground line-through", {
  variants: {
    size: {
      sm: "text-caption",
      md: "text-body-sm",
      lg: "text-body",
    },
  },
  defaultVariants: { size: "md" },
});

export type PriceSize = NonNullable<
  VariantProps<typeof amountVariants>["size"]
>;

export type PriceProps = Omit<ComponentProps<"span">, "children"> & {
  /** Current price in céntimos (integer minor units): 12990 is S/ 129.90. */
  amount: number;
  /** Previous price in céntimos, struck through. Shown only when greater than `amount`. */
  compareAt?: number;
  /** Defaults to `md`. */
  size?: PriceSize;
};

/**
 * Price in soles from integer céntimos, in Geist Sans with tabular figures.
 * With a higher `compareAt`, both prices get visually hidden labels so screen
 * readers announce "Precio actual" and "Precio anterior", not two bare numbers.
 * Throws a RangeError for invalid amounts (see `formatPEN`).
 */
export function Price({
  amount,
  compareAt,
  size,
  className,
  ...props
}: PriceProps) {
  assertMinorUnits(amount);
  if (compareAt !== undefined) assertMinorUnits(compareAt);
  const showCompareAt = compareAt !== undefined && compareAt > amount;

  return (
    <span
      {...props}
      data-slot="price"
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2 font-sans tabular-nums",
        className,
      )}
    >
      {showCompareAt ? (
        <>
          <span className={amountVariants({ size })}>
            <span className="sr-only">Precio actual: </span>
            {formatPEN(amount)}
          </span>{" "}
          <s className={compareAtVariants({ size })}>
            <span className="sr-only">Precio anterior: </span>
            {formatPEN(compareAt)}
          </s>
        </>
      ) : (
        <span className={amountVariants({ size })}>{formatPEN(amount)}</span>
      )}
    </span>
  );
}
