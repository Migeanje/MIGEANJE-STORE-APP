import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "@/shared/ui/atoms/availability-indicator";
import { Price } from "@/shared/ui/atoms/price";

export type ComparisonProduct = {
  /** Unique within the table (used as key), e.g. the slug. */
  key: string;
  href: string;
  name: string;
  /** Brand as plain descriptive text. */
  brand: string;
  image: {
    src: ImageProps["src"];
    alt: string;
    width: number;
    height: number;
  };
  /** In céntimos (integer minor units), see `Price`. */
  price: { amount: number; compareAt?: number };
  availability: { status: AvailabilityStatus; label: string };
  /** The comparison without this product. */
  removeHref: string;
};

export type ComparisonTableRow = {
  /** Unique within the table (used as key). */
  key: string;
  label: string;
  /** One formatted value per product, in order; null when it lacks the spec. */
  values: readonly (string | null)[];
  /** Not every product has the same value: marked with a lit LED. */
  differs: boolean;
};

export type ComparisonTableProps = Omit<
  ComponentProps<"div">,
  "children" | "role" | "tabIndex"
> & {
  /** Names the table and its scroll region, e.g. "Comparación de 3 cargadores". */
  caption: string;
  products: readonly ComparisonProduct[];
  rows: readonly ComparisonTableRow[];
};

// The first column stays put while the product columns scroll sideways.
const STICKY_CELL =
  "sticky left-0 z-10 w-32 min-w-32 bg-background text-left align-top sm:w-48 sm:min-w-48";
const CELL = "min-w-44 border-l border-border px-4 py-3 align-top";

function DiffLed({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full bg-primary shadow-glow",
        className,
      )}
    />
  );
}

function RowHeader({
  children,
  differs = false,
}: {
  children: ReactNode;
  differs?: boolean;
}) {
  return (
    <th
      scope="row"
      className={cn(
        STICKY_CELL,
        "py-3 pr-3 pl-4 text-body-sm font-normal text-muted-foreground",
      )}
    >
      {/* The LEDs line up at the column edge, whatever the label length. */}
      <span className="flex items-start justify-between gap-2">
        {children}
        {differs ? (
          <>
            <DiffLed className="mt-1.5" />{" "}
            <span className="sr-only">(valores distintos)</span>
          </>
        ) : null}
      </span>
    </th>
  );
}

/**
 * The comparator: products side by side, spec labels in a sticky first
 * column. The table scrolls sideways inside its own focusable region (named
 * by the caption), so the page never scrolls horizontally on a phone. Rows
 * whose values differ carry a lit LED (and the text "valores distintos" for
 * assistive tech); missing values read "Sin dato".
 */
export function ComparisonTable({
  caption,
  products,
  rows,
  className,
  ...props
}: ComparisonTableProps) {
  const anyDiffers = rows.some((row) => row.differs);

  return (
    <div {...props} className={cn("flex min-w-0 flex-col gap-3", className)}>
      {anyDiffers ? (
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <DiffLed />
          Valores distintos entre los productos
        </p>
      ) : null}
      <section
        aria-label={caption}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be focusable so keyboard users can scroll it (WCAG 2.1.1).
        tabIndex={0}
        data-lenis-prevent-horizontal
        className="max-w-full overflow-x-auto rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <table className="w-full border-collapse text-body-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border">
              <td className={cn(STICKY_CELL, "p-4")} />
              {products.map((product) => (
                <th
                  key={product.key}
                  scope="col"
                  className={cn(CELL, "py-4 text-left font-normal")}
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-square w-24 overflow-hidden rounded-md bg-card">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-radial-[closest-side] from-primary/35 to-transparent opacity-50"
                      />
                      <Image
                        src={product.image.src}
                        alt=""
                        width={product.image.width}
                        height={product.image.height}
                        sizes="96px"
                        className="relative size-full object-contain p-3"
                      />
                    </div>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-caption text-muted-foreground">
                        {product.brand}
                      </span>
                      <Link
                        href={product.href}
                        className="rounded-sm text-body font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {product.name}
                      </Link>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <RowHeader>Precio</RowHeader>
              {products.map((product) => (
                <td key={product.key} className={CELL}>
                  <Price
                    amount={product.price.amount}
                    compareAt={product.price.compareAt}
                  />
                </td>
              ))}
            </tr>
            <tr>
              <RowHeader>Disponibilidad</RowHeader>
              {products.map((product) => (
                <td key={product.key} className={CELL}>
                  <AvailabilityIndicator status={product.availability.status}>
                    {product.availability.label}
                  </AvailabilityIndicator>
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.key} data-differs={row.differs}>
                <RowHeader differs={row.differs}>{row.label}</RowHeader>
                {products.map((product, index) => {
                  const value = row.values[index] ?? null;
                  return (
                    <td
                      key={product.key}
                      className={cn(CELL, "font-mono text-foreground")}
                    >
                      {value === null ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground"
                          >
                            —
                          </span>
                          <span className="sr-only">Sin dato</span>
                        </>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <RowHeader>
                <span className="sr-only">Quitar de la comparación</span>
              </RowHeader>
              {products.map((product) => (
                <td key={product.key} className={CELL}>
                  <Link
                    href={product.removeHref}
                    className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Quitar <span className="sr-only">{product.name}</span>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
