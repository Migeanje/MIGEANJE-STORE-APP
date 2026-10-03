import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { formatPEN } from "@/shared/lib/money";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "@/shared/ui/atoms/availability-indicator";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Price } from "@/shared/ui/atoms/price";
import { Text } from "@/shared/ui/atoms/text";

/** What a cart line shows, without its controls. */
export type CartLineData = {
  /** Product page of this variant. */
  href: string;
  name: string;
  /** Brand name as plain descriptive text (never a logo). */
  brand?: string;
  /** The variant's option values, e.g. "Blanco". */
  variantLabel?: string;
  /** Product cutout; decorative here (the name is right next to it). */
  image: { src: ImageProps["src"]; width: number; height: number };
  /** The label carries the lead time, e.g. "En importación · llega en 15–20 días". */
  availability: { status: AvailabilityStatus; label: string };
  /** Price of one unit, in céntimos. */
  unitPrice: number;
  /** Unit price × quantity, in céntimos. */
  lineTotal: number;
  quantity: number;
};

export type CartLineProps = Omit<ComponentProps<"article">, "children"> &
  CartLineData & {
    /** Outline level of the product name. Defaults to 3. */
    headingLevel?: HeadingLevel;
    /** Called when the product link is followed (e.g. to close a drawer). */
    onLinkClick?: () => void;
    /** The line's controls: quantity and "Quitar". */
    children?: ReactNode;
  };

/**
 * One product in the cart: thumbnail, brand, name (linking to the product),
 * variant, availability LED with the lead time, line total (and the unit
 * price when there is more than one unit) and the controls under it.
 */
export function CartLine({
  href,
  name,
  brand,
  variantLabel,
  image,
  availability,
  unitPrice,
  lineTotal,
  quantity,
  headingLevel = 3,
  onLinkClick,
  children,
  className,
  ...props
}: CartLineProps) {
  return (
    <article {...props} className={cn("flex gap-4", className)}>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-background">
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="80px"
          className="size-full object-contain p-2"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {brand ? (
              <Text size="caption" tone="muted">
                {brand}
              </Text>
            ) : null}
            <Heading
              level={headingLevel}
              className="font-sans text-body font-medium text-pretty"
            >
              <Link
                href={href}
                onClick={onLinkClick}
                className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {name}
              </Link>
            </Heading>
            {variantLabel ? (
              <Text size="body-sm" tone="muted">
                {variantLabel}
              </Text>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <p>
              <span className="sr-only">Total: </span>
              <Price amount={lineTotal} size="sm" />
            </p>
            {quantity > 1 ? (
              <Text size="caption" tone="muted" className="tabular-nums">
                {formatPEN(unitPrice)} <span aria-hidden="true">c/u</span>
                <span className="sr-only">por unidad</span>
              </Text>
            ) : null}
          </div>
        </div>
        <AvailabilityIndicator status={availability.status}>
          {availability.label}
        </AvailabilityIndicator>
        {children ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {children}
          </div>
        ) : null}
      </div>
    </article>
  );
}
