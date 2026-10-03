import type { ProductDetails } from "@/modules/catalog/application/get-product";
import type {
  Availability,
  AvailabilityStatus,
} from "@/modules/catalog/domain/availability";
import type { Variant } from "@/modules/catalog/domain/product";
import {
  defaultVariant,
  variantBySku,
  variantOptions,
} from "@/modules/catalog/domain/variant-selection";
import { toDecimalAmount } from "@/shared/lib/money";
import type { Spec } from "@/shared/ui/molecules/spec-list";
import type { ExpertReviewContent } from "@/shared/ui/organisms/expert-review";
import type {
  VariantOptionGroup,
  VariantOptionValue,
} from "@/shared/ui/organisms/variant-selector";
import { backorderNote, blockedOptionLabel } from "./catalog-copy";
import { productHref } from "./catalog-url";
import { availabilityLabel } from "./product-card-view";
import { toSpecListItems } from "./spec-format";

/**
 * Most units per order line on the product page: in stock we can ship a few
 * more; a backorder is imported for you, so fewer.
 */
export const MAX_QUANTITY = {
  in_stock: 5,
  backorder: 2,
} as const satisfies Record<Exclude<AvailabilityStatus, "unavailable">, number>;

export type ProductPurchase =
  | { kind: "buy"; maxQuantity: number; note?: string }
  | { kind: "notify" };

const SCHEMA_AVAILABILITY = {
  in_stock: "https://schema.org/InStock",
  backorder: "https://schema.org/BackOrder",
  unavailable: "https://schema.org/OutOfStock",
} as const satisfies Record<AvailabilityStatus, string>;

/** schema.org `Product` with one `Offer` for the selected variant. */
export type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  sku: string;
  mpn?: string;
  category: string;
  image: string[];
  brand: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    /** Soles as a plain decimal, e.g. "189.90". */
    price: string;
    priceCurrency: "PEN";
    availability: (typeof SCHEMA_AVAILABILITY)[AvailabilityStatus];
    itemCondition: "https://schema.org/NewCondition";
  };
};

export type ProductPageView = {
  variant: Variant;
  optionGroups: VariantOptionGroup[];
  price: { amount: number; compareAt?: number };
  availability: { status: AvailabilityStatus; label: string };
  purchase: ProductPurchase;
  specs: Spec[];
  review: ExpertReviewContent | null;
  jsonLd: ProductJsonLd;
};

function purchaseFor(availability: Availability): ProductPurchase {
  switch (availability.status) {
    case "in_stock":
      return { kind: "buy", maxQuantity: MAX_QUANTITY.in_stock };
    case "backorder":
      return {
        kind: "buy",
        maxQuantity: MAX_QUANTITY.backorder,
        note: backorderNote(availability.leadTimeDays),
      };
    case "unavailable":
      return { kind: "notify" };
  }
}

/**
 * Everything the product page shows for one variant: the requested SKU, or
 * the default variant when it is missing or unknown (never an error: it comes
 * from the URL). Option values link to their variant; the default variant's
 * link is the bare product path.
 */
export function buildProductPageView(
  { product, category, specs }: ProductDetails,
  requestedSku?: string,
): ProductPageView {
  const fallback = defaultVariant(product);
  const variant =
    (requestedSku === undefined
      ? undefined
      : variantBySku(product, requestedSku)) ?? fallback;
  const hrefFor = (target: Variant) =>
    productHref(
      product.slug,
      target.sku === fallback.sku ? undefined : target.sku,
    );

  const optionGroups = variantOptions(product, variant).map(
    ({ option, selectedValue, choices }): VariantOptionGroup => ({
      key: option.key,
      label: option.label,
      selectedValue,
      values: choices.map(
        ({
          value,
          selected,
          variant: target,
          blockedBy,
        }): VariantOptionValue => {
          if (target !== null)
            return { value, selected, href: hrefFor(target) };
          return {
            value,
            selected,
            unavailableLabel: blockedBy ? blockedOptionLabel(blockedBy) : "",
          };
        },
      ),
    }),
  );

  const jsonLd: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    sku: variant.sku,
    ...(product.model !== undefined && { mpn: product.model }),
    category: category.name,
    image: product.images.map(({ src }) => src),
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      price: toDecimalAmount(variant.price),
      priceCurrency: "PEN",
      availability: SCHEMA_AVAILABILITY[variant.availability.status],
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return {
    variant,
    optionGroups,
    price:
      variant.compareAt === undefined
        ? { amount: variant.price }
        : { amount: variant.price, compareAt: variant.compareAt },
    availability: {
      status: variant.availability.status,
      label: availabilityLabel(variant.availability),
    },
    purchase: purchaseFor(variant.availability),
    specs: toSpecListItems(specs),
    review: product.expertReview ?? null,
    jsonLd,
  };
}
