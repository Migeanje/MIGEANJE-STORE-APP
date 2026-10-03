import * as z from "zod";
import {
  type Availability,
  availabilitySchema,
  bestAvailability,
  isPurchasable,
} from "./availability";
import { brandSchema } from "./brand";
import { categoryRefSchema, specValueSchema } from "./category";
import { expertReviewSchema } from "./expert-review";
import { type Money, moneySchema } from "./money";
import { duplicates, keySchema, slugSchema, textSchema } from "./primitives";

/** Image with intrinsic size, as `next/image` needs for local and remote files. */
export const productImageSchema = z.strictObject({
  /** Site path ("/mock/products/cables.svg") or an https URL. */
  src: z
    .string()
    .regex(/^(\/|https:\/\/)\S+$/, "Expected a site path or an https URL"),
  alt: textSchema,
  width: z.int().positive(),
  height: z.int().positive(),
});

/** A variant axis, e.g. { key: "color", label: "Color" }. */
export const productOptionSchema = z.strictObject({
  key: keySchema,
  label: textSchema,
});

export const variantSchema = z
  .strictObject({
    /** Our stock-keeping unit, uppercase, e.g. "ANK-A121D-WHT". */
    sku: z
      .string()
      .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, "Expected an uppercase SKU"),
    /** One value per product option, e.g. { color: "Negro" }. */
    options: z.record(keySchema, textSchema),
    price: moneySchema,
    /** Previous price, shown struck through. Must be above `price`. */
    compareAt: moneySchema.optional(),
    availability: availabilitySchema,
  })
  .refine(
    (variant) =>
      variant.compareAt === undefined || variant.compareAt > variant.price,
    { message: "compareAt must be above the price", path: ["compareAt"] },
  );

export const productSchema = z
  .strictObject({
    slug: slugSchema,
    /** Model name without the brand, e.g. "Nano Charger 45W Smart Display". */
    name: textSchema,
    /** Manufacturer model number, e.g. "A121D". Searchable. */
    model: textSchema.optional(),
    brand: brandSchema,
    category: categoryRefSchema,
    /** One or two sentences for cards and the product page. */
    summary: textSchema,
    images: z.array(productImageSchema).min(1),
    /** Values keyed by spec key; validated against the category in `catalogSchema`. */
    specs: z.record(keySchema, specValueSchema),
    /** Variant axes, in display order. Empty for single-variant products. */
    options: z.array(productOptionSchema),
    variants: z.array(variantSchema).min(1),
    expertReview: expertReviewSchema.optional(),
    tags: z.array(textSchema),
  })
  .superRefine((product, ctx) => {
    const issue = (message: string, path: PropertyKey[]) =>
      ctx.addIssue({ code: "custom", message, path });
    const optionKeys = product.options.map((option) => option.key);
    const expected = [...optionKeys].sort().join(", ") || "(none)";

    for (const key of duplicates(optionKeys)) {
      issue(`Option "${key}" is defined twice`, ["options"]);
    }
    for (const tag of duplicates(product.tags)) {
      issue(`Tag "${tag}" is used twice`, ["tags"]);
    }
    for (const sku of duplicates(
      product.variants.map((variant) => variant.sku),
    )) {
      issue(`SKU "${sku}" is used twice`, ["variants"]);
    }

    const seen = new Map<string, string>();
    product.variants.forEach((variant, index) => {
      const keys = Object.keys(variant.options).sort().join(", ") || "(none)";
      if (keys !== expected) {
        issue(
          `Variant "${variant.sku}" must set exactly the options: ${expected}`,
          ["variants", index, "options"],
        );
        return;
      }
      const combination = JSON.stringify(
        optionKeys.map((key) => variant.options[key]),
      );
      const first = seen.get(combination);
      if (first !== undefined) {
        issue(
          `Variants "${first}" and "${variant.sku}" have the same options`,
          ["variants", index, "options"],
        );
      }
      seen.set(combination, first ?? variant.sku);
    });
  });

export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductOption = z.infer<typeof productOptionSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Product = z.infer<typeof productSchema>;

/** Product-level price, derived from the variants. */
export type PriceSummary = {
  /** "Desde" price: the cheapest variant you can buy. */
  from: Money;
  /** Most expensive variant you can buy (equal to `from` without a range). */
  to: Money;
  /** The struck-through price of the variant that sets `from`, if any. */
  compareAt?: Money;
};

/**
 * Derives the product price from the variants you can buy (in stock or on
 * backorder). When none can be bought, every variant counts, so the "Avísame"
 * page still shows a reference price.
 */
export function productPrice(product: Pick<Product, "variants">): PriceSummary {
  const purchasable = product.variants.filter((variant) =>
    isPurchasable(variant.availability),
  );
  const pool = purchasable.length > 0 ? purchasable : product.variants;
  const cheapest = pool.reduce((best, next) =>
    next.price < best.price ? next : best,
  );
  const to = Math.max(...pool.map((variant) => variant.price));
  return cheapest.compareAt === undefined
    ? { from: cheapest.price, to }
    : { from: cheapest.price, to, compareAt: cheapest.compareAt };
}

/** Product-level availability: the best one across its variants. */
export function productAvailability(
  product: Pick<Product, "variants">,
): Availability {
  return bestAvailability(
    product.variants.map((variant) => variant.availability),
  );
}
