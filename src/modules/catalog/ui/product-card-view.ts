import type { Availability } from "@/modules/catalog/domain/availability";
import {
  type Category,
  type ResolvedSpec,
  resolveSpecs,
} from "@/modules/catalog/domain/category";
import {
  type Product,
  productAvailability,
  productPrice,
} from "@/modules/catalog/domain/product";
import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import { leadTimeLabel } from "./catalog-copy";
import { productPath } from "./catalog-url";

const MAX_CARD_SPECS = 3;
const MAX_TAG_LENGTH = 20;

const NUMBER_FORMAT = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

/** Customer copy for a derived availability (the LED label). */
export function availabilityLabel(availability: Availability): string {
  switch (availability.status) {
    case "in_stock":
      return "En stock";
    case "backorder":
      return `En importación · llega en ${leadTimeLabel(availability.leadTimeDays)}`;
    case "unavailable":
      return "Agotado";
  }
}

function specTag({ kind, value, unit }: ResolvedSpec): string | null {
  switch (kind) {
    case "number":
      // A bare number ("2") means nothing on a card without its label.
      return typeof value === "number" && unit !== undefined
        ? `${NUMBER_FORMAT.format(value)} ${unit}`
        : null;
    case "text":
      return typeof value === "string" && value.length <= MAX_TAG_LENGTH
        ? value
        : null;
    case "list":
      return Array.isArray(value) && value[0] !== undefined ? value[0] : null;
    case "boolean":
      return null;
  }
}

/**
 * Up to three short spec values for a product card, in display order: numbers
 * with their unit ("65 W"), short texts ("GaN") and the first item of lists.
 * Empty when the category is unknown.
 */
export function productCardSpecs(
  product: Product,
  category: Category | undefined,
): string[] {
  if (category === undefined) return [];
  const tags = resolveSpecs(product.specs, category).flatMap(
    (spec) => specTag(spec) ?? [],
  );
  return [...new Set(tags)].slice(0, MAX_CARD_SPECS);
}

/**
 * The listing card of a product: link to its page, first image, brand as
 * text, derived price (the cheapest variant you can buy) and availability.
 */
export function toProductCardProps(
  product: Product,
  category: Category | undefined,
): ProductCardProps {
  const price = productPrice(product);
  const availability = productAvailability(product);
  const [image] = product.images;
  return {
    href: productPath(product.slug),
    image,
    brand: product.brand.name,
    name: product.name,
    specs: productCardSpecs(product, category),
    price:
      price.compareAt === undefined
        ? { amount: price.from }
        : { amount: price.from, compareAt: price.compareAt },
    availability: {
      status: availability.status,
      label: availabilityLabel(availability),
    },
  };
}
