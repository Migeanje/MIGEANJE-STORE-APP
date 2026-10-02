import Image, { type ImageProps } from "next/image";
import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import {
  AvailabilityIndicator,
  type AvailabilityStatus,
} from "@/shared/ui/atoms/availability-indicator";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Price } from "@/shared/ui/atoms/price";
import { Tag } from "@/shared/ui/atoms/tag";
import { Text } from "@/shared/ui/atoms/text";

const MAX_SPECS = 3;

// 1 column on phones, 2 from `sm`, 4 from `lg` (the listing grid).
const IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export type ProductCardProps = Omit<ComponentProps<"article">, "children"> & {
  /** Product page, e.g. "/productos/cargador-gan-65w". */
  href: LinkProps["href"];
  /** Transparent cutout of the product. */
  image: {
    src: ImageProps["src"];
    alt: string;
    width: number;
    height: number;
  };
  /** Brand name as plain descriptive text (never a logo). */
  brand: string;
  name: string;
  /**
   * Short spec values such as "65 W", "GaN", "USB-C". Duplicates are dropped,
   * then only the first 3 show.
   */
  specs?: readonly string[];
  /** In céntimos (integer minor units), see `Price`. */
  price: { amount: number; compareAt?: number };
  availability: { status: AvailabilityStatus; label: string };
  /** Outline level of the product name. Defaults to 3. */
  headingLevel?: HeadingLevel;
};

/**
 * Listing card: the product cutout on a warm amber glow, brand, name, up to 3
 * spec tags, price and availability. The name link is stretched over the
 * whole card (one link, no nested controls); the card shows the keyboard
 * focus ring, and the glow lights up on hover and focus.
 */
export function ProductCard({
  href,
  image,
  brand,
  name,
  specs = [],
  price,
  availability,
  headingLevel = 3,
  className,
  ...props
}: ProductCardProps) {
  // A repeated tag carries no information, and the spec is the React key.
  const shownSpecs = [...new Set(specs)].slice(0, MAX_SPECS);

  return (
    <article
      {...props}
      className={cn(
        "group relative flex h-full flex-col rounded-lg border bg-card p-2",
        // The stretched link hides its own outline; the card shows it.
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
        className,
      )}
    >
      {/* Concentric corners: rounded-lg card - p-2 = rounded-md image well. */}
      <div
        data-slot="media"
        className="relative aspect-square overflow-hidden rounded-md bg-background"
      >
        {/* "Encendido": the warm glow behind the product turns up when active. */}
        <div
          data-slot="glow"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-radial-[closest-side] from-primary/35 to-transparent",
            "opacity-40 transition-opacity duration-(--duration-fast) ease-out",
            "group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        />
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={IMAGE_SIZES}
          className="relative size-full object-contain p-6"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-2 pt-4 pb-2">
        <div className="flex flex-col gap-1">
          <Text size="caption" tone="muted">
            {brand}
          </Text>
          <Heading
            level={headingLevel}
            className="line-clamp-2 text-body font-medium"
          >
            <Link
              href={href}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {name}
            </Link>
          </Heading>
        </div>

        {shownSpecs.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {shownSpecs.map((spec) => (
              <li key={spec}>
                <Tag mono>{spec}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1">
          <Price amount={price.amount} compareAt={price.compareAt} />
          <AvailabilityIndicator status={availability.status}>
            {availability.label}
          </AvailabilityIndicator>
        </div>
      </div>
    </article>
  );
}
