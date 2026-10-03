import type { ProductLookup } from "@/modules/cart/application/ports";
import type { CartOffer, OfferAvailability } from "@/modules/cart/domain/cart";
import type { CatalogRepository } from "@/modules/catalog/application/catalog-repository";
import type { Availability } from "@/modules/catalog/domain/availability";
import type { Product, Variant } from "@/modules/catalog/domain/product";
import { productHref } from "@/modules/catalog/ui/catalog-url";

/*
 * Anti-corruption layer between the catalog and the cart: the only cart file
 * that knows catalog types. It maps a catalog variant to a CartOffer (plain
 * copies: catalog data is deeply frozen and shared across requests).
 */

function toOfferAvailability(availability: Availability): OfferAvailability {
  return availability.status === "backorder"
    ? {
        status: "backorder",
        leadTimeDays: { ...availability.leadTimeDays },
      }
    : { status: availability.status };
}

/** The variant's option values in option order, e.g. "Negro · 2 m". */
function variantLabel(product: Product, variant: Variant): string {
  return product.options
    .flatMap(({ key }) => variant.options[key] ?? [])
    .join(" · ");
}

function toOffer(product: Product, variant: Variant): CartOffer {
  // The catalog schema guarantees at least one image.
  const [image] = product.images as [Product["images"][number]];
  return {
    sku: variant.sku,
    unitPrice: variant.price,
    availability: toOfferAvailability(variant.availability),
    product: {
      name: product.name,
      brand: product.brand.name,
      variantLabel: variantLabel(product, variant),
      // Always with `?variante=`: it opens the page on this exact variant
      // (the canonical URL stays the bare product path).
      href: productHref(product.slug, variant.sku),
      image: { src: image.src, width: image.width, height: image.height },
    },
  };
}

/**
 * ProductLookup backed by the catalog port. It scans the catalog for the
 * SKU, which is fine for the 19 mock products; the Medusa adapter (F3) will
 * fetch the variant directly.
 */
export function createCatalogProductLookup(
  catalog: CatalogRepository,
): ProductLookup {
  return {
    async findOffer(sku) {
      const { items } = await catalog.listProducts();
      for (const product of items) {
        const variant = product.variants.find((entry) => entry.sku === sku);
        if (variant) return toOffer(product, variant);
      }
      return null;
    },
  };
}
