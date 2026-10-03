import type { CategoryListing } from "@/modules/catalog/application/list-category-products";
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/modules/catalog/domain/availability";
import type { Facet } from "@/modules/catalog/domain/facets";
import type {
  ProductFilters,
  ProductSort,
  SpecFilter,
} from "@/modules/catalog/domain/product-query";
import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import type { SortOption } from "@/shared/ui/molecules/sort-select";
import type { ActiveFilter } from "@/shared/ui/organisms/active-filters";
import type {
  FilterCheckboxOption,
  FilterGroup,
  HiddenField,
} from "@/shared/ui/organisms/filter-panel";
import { resultCountLabel } from "./catalog-copy";
import {
  AVAILABILITY_PARAM,
  AVAILABILITY_PARAM_VALUES,
  BRAND_PARAM,
  CATEGORY_SORTS,
  type CategoryQuery,
  categoryHref,
  categorySearchParams,
  RANGE_FROM_SUFFIX,
  RANGE_TO_SUFFIX,
  SORT_PARAM,
  specParams,
  TOGGLE_VALUE,
} from "./catalog-url";
import { toProductCardProps } from "./product-card-view";

/** Products per category page. */
export const CATEGORY_PAGE_SIZE = 12;

/** Filter labels of the derived availability (the LED labels add lead times). */
export const AVAILABILITY_FILTER_LABELS = {
  in_stock: "En stock",
  backorder: "En importación",
  unavailable: "Agotado",
} as const satisfies Record<AvailabilityStatus, string>;

const FEATURES_LEGEND = "Características";

const NUMBER_FORMAT = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

/** Everything the category page renders, derived from the listing. */
export type CategoryPageView = {
  /** The applied query (sanitized filters, current sort and page). */
  query: CategoryQuery;
  /** The canonical URL of the applied query. */
  canonicalHref: string;
  /** "4 productos" or "2 de 4 productos". */
  count: string;
  filterGroups: FilterGroup[];
  activeFilters: ActiveFilter[];
  activeCount: number;
  /** The page without filters, keeping the sort. */
  clearHref: string;
  /** Kept by the filter form: the sort. */
  filterHiddenFields: HiddenField[];
  sort: {
    name: string;
    value: string;
    options: SortOption[];
    /** Kept by the sort form: the filters. */
    hiddenFields: HiddenField[];
  };
  pagination: { page: number; pageCount: number };
  hrefForPage: (page: number) => string;
  products: ProductCardProps[];
};

function withUnit(value: number, unit?: string): string {
  const number = NUMBER_FORMAT.format(value);
  return unit ? `${number} ${unit}` : number;
}

function rangeLabel(
  { min, max }: Extract<SpecFilter, { kind: "range" }>,
  unit?: string,
): string {
  if (min !== undefined && max !== undefined) {
    return min === max
      ? withUnit(min, unit)
      : `${NUMBER_FORMAT.format(min)}–${withUnit(max, unit)}`;
  }
  return min !== undefined
    ? `desde ${withUnit(min, unit)}`
    : `hasta ${withUnit(max ?? 0, unit)}`;
}

/**
 * A group of values is worth showing when there is a choice to make (or one
 * is already selected). Features are not: each one is its own yes/no choice.
 */
function hasChoice(group: FilterGroup): boolean {
  if (group.kind === "range" || group.legend === FEATURES_LEGEND) return true;
  return (
    group.options.length > 1 || group.options.some((option) => option.checked)
  );
}

function filterGroups(listing: CategoryListing): FilterGroup[] {
  const { category, facets, filters, categoryTotal } = listing;
  const names = new Map(
    specParams(category).map(({ key, name }) => [key, name]),
  );
  const brands = new Set(filters.brands ?? []);
  const statuses = new Set(filters.availability ?? []);

  const groups: FilterGroup[] = [
    {
      kind: "checkboxes",
      legend: "Marca",
      options: facets.brands.map(({ value, label, count }) => ({
        name: BRAND_PARAM,
        value,
        label,
        count,
        checked: brands.has(value),
      })),
    },
    {
      kind: "checkboxes",
      legend: "Disponibilidad",
      options: facets.availability.map(({ value, count }) => ({
        name: AVAILABILITY_PARAM,
        value: AVAILABILITY_PARAM_VALUES[value],
        label: AVAILABILITY_FILTER_LABELS[value],
        count,
        checked: statuses.has(value),
      })),
    },
  ];

  const features: FilterCheckboxOption[] = [];
  for (const facet of facets.specs) {
    const name = names.get(facet.key);
    if (name === undefined) continue;
    const filter = filters.specs?.[facet.key];
    switch (facet.kind) {
      case "range": {
        const range = filter?.kind === "range" ? filter : undefined;
        if (facet.min === facet.max && range === undefined) break;
        groups.push({
          kind: "range",
          legend: facet.label,
          ...(facet.unit !== undefined && { unit: facet.unit }),
          min: facet.min,
          max: facet.max,
          from: {
            name: `${name}${RANGE_FROM_SUFFIX}`,
            ...(range?.min !== undefined && { value: range.min }),
          },
          to: {
            name: `${name}${RANGE_TO_SUFFIX}`,
            ...(range?.max !== undefined && { value: range.max }),
          },
        });
        break;
      }
      case "options": {
        const selected = new Set(
          filter?.kind === "options" ? filter.values : [],
        );
        groups.push({
          kind: "checkboxes",
          legend: facet.label,
          options: facet.options.map(({ value, label, count }) => ({
            name,
            value,
            label,
            count,
            checked: selected.has(value),
          })),
        });
        break;
      }
      case "toggle": {
        const checked = filter?.kind === "toggle";
        // A feature every product has narrows nothing.
        if (facet.count < categoryTotal || checked) {
          features.push({
            name,
            value: TOGGLE_VALUE,
            label: facet.label,
            count: facet.count,
            checked,
          });
        }
        break;
      }
    }
  }
  if (features.length > 0) {
    groups.push({
      kind: "checkboxes",
      legend: FEATURES_LEGEND,
      options: features,
    });
  }
  return groups.filter(hasChoice);
}

function withoutSpec(
  filters: ProductFilters,
  key: string,
  replacement?: SpecFilter,
): ProductFilters {
  const { [key]: _removed, ...specs } = filters.specs ?? {};
  return {
    ...filters,
    specs: replacement === undefined ? specs : { ...specs, [key]: replacement },
  };
}

function activeFilters(
  listing: CategoryListing,
  sort: ProductSort,
): ActiveFilter[] {
  const { category, facets, filters } = listing;
  const href = (next: ProductFilters) =>
    categoryHref(category, { filters: next, sort, page: 1 });
  const chips: ActiveFilter[] = [];

  for (const brand of filters.brands ?? []) {
    chips.push({
      label: facets.brands.find(({ value }) => value === brand)?.label ?? brand,
      removeHref: href({
        ...filters,
        brands: filters.brands?.filter((entry) => entry !== brand),
      }),
    });
  }
  for (const status of AVAILABILITY_STATUSES) {
    if (!filters.availability?.includes(status)) continue;
    chips.push({
      label: AVAILABILITY_FILTER_LABELS[status],
      removeHref: href({
        ...filters,
        availability: filters.availability.filter((entry) => entry !== status),
      }),
    });
  }

  const facetsByKey = new Map<string, Facet>(
    facets.specs.map((facet) => [facet.key, facet]),
  );
  for (const { key } of specParams(category)) {
    const filter = filters.specs?.[key];
    const facet = facetsByKey.get(key);
    if (filter === undefined || facet === undefined) continue;
    switch (filter.kind) {
      case "range":
        chips.push({
          label: `${facet.label}: ${rangeLabel(filter, facet.kind === "range" ? facet.unit : undefined)}`,
          removeHref: href(withoutSpec(filters, key)),
        });
        break;
      case "options":
        for (const value of filter.values) {
          const rest = filter.values.filter((entry) => entry !== value);
          chips.push({
            label: `${facet.label}: ${value}`,
            removeHref: href(
              withoutSpec(
                filters,
                key,
                rest.length > 0 ? { kind: "options", values: rest } : undefined,
              ),
            ),
          });
        }
        break;
      case "toggle":
        chips.push({
          label: facet.label,
          removeHref: href(withoutSpec(filters, key)),
        });
        break;
    }
  }
  return chips;
}

function fields(params: URLSearchParams): HiddenField[] {
  return [...params].map(([name, value]) => ({ name, value }));
}

/**
 * The category page's view model: filter groups (only the ones that can
 * narrow the results), removable chips, hidden fields that keep the sort and
 * the filters across the two forms, page links and product cards. Links are
 * canonical and go back to page 1 whenever the filters change.
 */
export function buildCategoryPageView(
  listing: CategoryListing,
  sort: ProductSort,
): CategoryPageView {
  const { category, filters, results, categoryTotal } = listing;
  const query: CategoryQuery = { filters, sort, page: results.page };
  const sortParam =
    CATEGORY_SORTS.find((entry) => entry.sort === sort)?.param ?? "relevancia";
  const chips = activeFilters(listing, sort);

  return {
    query,
    canonicalHref: categoryHref(category, query),
    count: resultCountLabel(results.total, categoryTotal),
    filterGroups: filterGroups(listing),
    activeFilters: chips,
    activeCount: chips.length,
    clearHref: categoryHref(category, { filters: {}, sort, page: 1 }),
    filterHiddenFields:
      sortParam === "relevancia"
        ? []
        : [{ name: SORT_PARAM, value: sortParam }],
    sort: {
      name: SORT_PARAM,
      value: sortParam,
      options: CATEGORY_SORTS.map(({ param, label }) => ({
        value: param,
        label,
      })),
      hiddenFields: fields(
        categorySearchParams({ filters, sort: "featured", page: 1 }, category),
      ),
    },
    pagination: { page: results.page, pageCount: results.pageCount },
    hrefForPage: (page) => categoryHref(category, { ...query, page }),
    products: results.items.map((product) =>
      toProductCardProps(product, category),
    ),
  };
}
