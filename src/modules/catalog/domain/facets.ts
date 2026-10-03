import { AVAILABILITY_STATUSES, type AvailabilityStatus } from "./availability";
import { type Category, orderedSpecs, type SpecDefinition } from "./category";
import { type Product, productAvailability } from "./product";

/** One selectable value and how many products have it. */
export type FacetOption = { value: string; label: string; count: number };

/** A derived availability and how many products have it. The UI names it. */
export type AvailabilityFacetOption = {
  value: AvailabilityStatus;
  count: number;
};

/** A filter the category page can offer, built from a filterable spec. */
export type Facet =
  | {
      kind: "range";
      key: string;
      label: string;
      unit?: string;
      min: number;
      max: number;
    }
  | { kind: "options"; key: string; label: string; options: FacetOption[] }
  | { kind: "toggle"; key: string; label: string; count: number };

export type CategoryFacets = {
  brands: FacetOption[];
  /** Best first; statuses no product has are left out. */
  availability: AvailabilityFacetOption[];
  specs: Facet[];
};

const COLLATOR = new Intl.Collator("es-PE", {
  sensitivity: "base",
  numeric: true,
});

function countOptions(
  entries: Iterable<{ value: string; label: string }>,
): FacetOption[] {
  const counts = new Map<string, FacetOption>();
  for (const { value, label } of entries) {
    const option = counts.get(value) ?? { value, label, count: 0 };
    option.count += 1;
    counts.set(value, option);
  }
  return [...counts.values()].sort((a, b) =>
    COLLATOR.compare(a.label, b.label),
  );
}

function specFacet(
  definition: SpecDefinition,
  products: readonly Product[],
): Facet | null {
  const { key, label } = definition;
  const values = products.map((product) => product.specs[key]);

  switch (definition.kind) {
    case "number": {
      const numbers = values.filter((value) => typeof value === "number");
      if (numbers.length === 0) return null;
      return {
        kind: "range",
        key,
        label,
        ...(definition.unit !== undefined && { unit: definition.unit }),
        min: Math.min(...numbers),
        max: Math.max(...numbers),
      };
    }
    case "text":
    case "list": {
      // A list counts each product once per distinct item.
      const options = countOptions(
        values.flatMap((value) => {
          const items =
            typeof value === "string"
              ? [value]
              : Array.isArray(value)
                ? value
                : [];
          return [...new Set(items)].map((item) => ({
            value: item,
            label: item,
          }));
        }),
      );
      return options.length === 0
        ? null
        : { kind: "options", key, label, options };
    }
    case "boolean": {
      const count = values.filter((value) => value === true).length;
      return count === 0 ? null : { kind: "toggle", key, label, count };
    }
  }
}

function availabilityOptions(
  products: readonly Product[],
): AvailabilityFacetOption[] {
  const statuses = products.map(
    (product) => productAvailability(product).status,
  );
  return AVAILABILITY_STATUSES.flatMap((value) => {
    const count = statuses.filter((status) => status === value).length;
    return count === 0 ? [] : [{ value, count }];
  });
}

/**
 * Facets for a category page: one per filterable spec (in display order) plus
 * the brands and the derived availability. Facets that no product can match
 * are left out. Compute them from the unfiltered category so options do not
 * disappear while filtering.
 */
export function computeFacets(
  products: readonly Product[],
  category: Category,
): CategoryFacets {
  const specs = orderedSpecs(category)
    .filter((definition) => definition.filterable)
    .flatMap((definition) => specFacet(definition, products) ?? []);
  const brands = countOptions(
    products.map(({ brand }) => ({ value: brand.slug, label: brand.name })),
  );
  return { brands, availability: availabilityOptions(products), specs };
}
