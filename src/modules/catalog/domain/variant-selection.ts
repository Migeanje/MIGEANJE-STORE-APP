import { compareAvailability, isPurchasable } from "./availability";
import type { Product, ProductOption, Variant } from "./product";

type VariantSource = Pick<Product, "options" | "variants">;

/**
 * The variant a product page shows when none is chosen: the best
 * availability (see `compareAvailability`), then the lowest price, then
 * catalog order.
 */
export function defaultVariant(product: Pick<Product, "variants">): Variant {
  return product.variants.reduce((best, next) => {
    const byAvailability = compareAvailability(
      next.availability,
      best.availability,
    );
    if (byAvailability !== 0) return byAvailability < 0 ? next : best;
    return next.price < best.price ? next : best;
  });
}

/** The variant with exactly this SKU, if the product has it. */
export function variantBySku(
  product: Pick<Product, "variants">,
  sku: string,
): Variant | undefined {
  return product.variants.find((variant) => variant.sku === sku);
}

/** Why an option value cannot be chosen from the current selection. */
export type OptionBlock =
  /** No variant combines it with the selected value of an earlier option. */
  | { kind: "combination"; option: ProductOption; value: string }
  /** Every variant with it is unavailable, while others can be bought. */
  | { kind: "sold_out" };

export type OptionChoice = {
  value: string;
  selected: boolean;
  /** The variant this choice leads to; null when it cannot be chosen. */
  variant: Variant | null;
  /** Only when `variant` is null. */
  blockedBy?: OptionBlock;
};

export type OptionAxis = {
  option: ProductOption;
  selectedValue: string;
  choices: OptionChoice[];
};

/** Distinct values of an option, in the order the variants first use them. */
function optionValues(variants: readonly Variant[], key: string): string[] {
  return [
    ...new Set(variants.flatMap((variant) => variant.options[key] ?? [])),
  ];
}

/**
 * The variant selector of a product page. Options are hierarchical, in
 * display order: a value of option N is offered only together with the
 * selected values of options 0..N-1, so the first option is never blocked and
 * there is always a way to reach every variant. Choosing a value leads to the
 * closest variant: the one that keeps most of the later selections, then the
 * best availability, then catalog order.
 *
 * A value is blocked when no variant combines it with the earlier selections
 * (the reason names the first such option), or when all those variants are
 * unavailable while the product can still be bought elsewhere. When nothing
 * can be bought (the whole product is "Avísame"), availability blocks nothing.
 */
export function variantOptions(
  product: VariantSource,
  selected: Variant,
): OptionAxis[] {
  const keys = product.options.map((option) => option.key);
  const sellsSomething = product.variants.some((variant) =>
    isPurchasable(variant.availability),
  );
  const matches = (variant: Variant, key: string) =>
    variant.options[key] === selected.options[key];

  return product.options.map((option, index) => {
    const earlier = keys.slice(0, index);
    const later = keys.slice(index + 1);
    const selectedValue = selected.options[option.key] ?? "";

    const choices = optionValues(product.variants, option.key).map(
      (value): OptionChoice => {
        if (value === selectedValue) {
          return { value, selected: true, variant: selected };
        }
        const withValue = product.variants.filter(
          (variant) => variant.options[option.key] === value,
        );
        const candidates = withValue.filter((variant) =>
          earlier.every((key) => matches(variant, key)),
        );

        if (candidates.length === 0) {
          // The first earlier option that rules the value out.
          const conflict = earlier.findIndex(
            (_, last) =>
              !withValue.some((variant) =>
                earlier
                  .slice(0, last + 1)
                  .every((key) => matches(variant, key)),
              ),
          );
          const blocking = product.options[conflict] ?? option;
          return {
            value,
            selected: false,
            variant: null,
            blockedBy: {
              kind: "combination",
              option: blocking,
              value: selected.options[blocking.key] ?? "",
            },
          };
        }
        if (
          sellsSomething &&
          candidates.every((variant) => !isPurchasable(variant.availability))
        ) {
          return {
            value,
            selected: false,
            variant: null,
            blockedBy: { kind: "sold_out" },
          };
        }

        const kept = (variant: Variant) =>
          later.filter((key) => matches(variant, key)).length;
        const closest = candidates.reduce((best, next) => {
          const byKept = kept(next) - kept(best);
          if (byKept !== 0) return byKept > 0 ? next : best;
          return compareAvailability(next.availability, best.availability) < 0
            ? next
            : best;
        });
        return { value, selected: false, variant: closest };
      },
    );

    return { option, selectedValue, choices };
  });
}
