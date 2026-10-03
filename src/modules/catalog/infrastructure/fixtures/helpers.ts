import type { Availability } from "@/modules/catalog/domain/availability";
import type {
  Category,
  SpecDefinition,
  SpecKind,
} from "@/modules/catalog/domain/category";
import type { Money } from "@/modules/catalog/domain/money";
import type {
  ProductImage,
  ProductOption,
  Variant,
} from "@/modules/catalog/domain/product";

export const IN_STOCK: Availability = { status: "in_stock" };
/** "En importación": every mock backorder arrives in 15 to 20 days. */
export const BACKORDER: Availability = {
  status: "backorder",
  leadTimeDays: { min: 15, max: 20 },
};
/** Apple group (future line): shown with "Avísame". */
export const UNAVAILABLE: Availability = { status: "unavailable" };

export const COLOR: ProductOption = { key: "color", label: "Color" };

type SpecOptions = {
  unit?: string;
  filterable?: boolean;
  comparable?: boolean;
};

/** A spec definition; comparable by default, filterable only when asked. */
export function spec(
  order: number,
  key: string,
  label: string,
  kind: SpecKind,
  { unit, filterable = false, comparable = true }: SpecOptions = {},
): SpecDefinition {
  return {
    key,
    label,
    kind,
    order,
    filterable,
    comparable,
    ...(unit !== undefined && { unit }),
  };
}

/** Neutral category silhouette (no manufacturer photography in mocks). */
export function placeholderImage(
  category: Category,
  productName: string,
): ProductImage {
  return {
    src: `/mock/products/${category.slug}.svg`,
    alt: `Imagen referencial de ${productName}`,
    width: 640,
    height: 640,
  };
}

/** One variant per color, e.g. colorVariants("ANK-A121D", [["Negro", "BLK"]], ...). */
export function colorVariants(
  skuPrefix: string,
  colors: readonly (readonly [label: string, code: string])[],
  base: { price: Money; compareAt?: Money; availability: Availability },
): Variant[] {
  return colors.map(([color, code]) => ({
    ...base,
    sku: `${skuPrefix}-${code}`,
    options: { color },
  }));
}
