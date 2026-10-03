import type { AvailabilityStatus } from "./availability";
import type { Category, SpecKind, SpecValue } from "./category";
import { type Product, productAvailability, productPrice } from "./product";

/**
 * A filter on one spec: an inclusive range for numbers, any of the selected
 * options for text and lists, "must be true" for booleans.
 */
export type SpecFilter =
  | { kind: "range"; min?: number; max?: number }
  | { kind: "options"; values: readonly string[] }
  | { kind: "toggle" };

/** Filters combine with AND; the values inside one filter combine with OR. */
export type ProductFilters = {
  /** Brand slugs. */
  brands?: readonly string[];
  /** Derived product availability (see `productAvailability`). */
  availability?: readonly AvailabilityStatus[];
  /** Keyed by spec key. */
  specs?: Readonly<Record<string, SpecFilter>>;
};

export const PRODUCT_SORTS = [
  "featured",
  "price_asc",
  "price_desc",
  "name_asc",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** 1-based page. Out-of-range values are clamped by `paginate`. */
export type Pagination = { page: number; pageSize: number };

export const MAX_PAGE_SIZE = 100;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ProductPage = Page<Product>;

export type ProductQuery = {
  categorySlug?: string;
  brandSlug?: string;
  filters?: ProductFilters;
  /** Defaults to "featured" (catalog order). */
  sort?: ProductSort;
  /** Without it, every match comes back as one page. */
  pagination?: Pagination;
};

const FILTER_KIND: Record<SpecKind, SpecFilter["kind"]> = {
  number: "range",
  text: "options",
  list: "options",
  boolean: "toggle",
};

function matchesSpec(
  value: SpecValue | undefined,
  filter: SpecFilter,
): boolean {
  switch (filter.kind) {
    case "range":
      return (
        typeof value === "number" &&
        (filter.min === undefined || value >= filter.min) &&
        (filter.max === undefined || value <= filter.max)
      );
    case "options":
      if (typeof value === "string") return filter.values.includes(value);
      return (
        Array.isArray(value) &&
        value.some((item) => filter.values.includes(item))
      );
    case "toggle":
      return value === true;
  }
}

function isEmptyFilter(filter: SpecFilter): boolean {
  if (filter.kind === "options") return filter.values.length === 0;
  if (filter.kind === "range") {
    return filter.min === undefined && filter.max === undefined;
  }
  return false;
}

/** Products matching every filter; empty selections are ignored. */
export function filterProducts(
  products: readonly Product[],
  filters: ProductFilters,
): Product[] {
  const { brands = [], availability = [], specs = {} } = filters;
  const specFilters = Object.entries(specs).filter(
    ([, filter]) => !isEmptyFilter(filter),
  );
  return products.filter(
    (product) =>
      (brands.length === 0 || brands.includes(product.brand.slug)) &&
      (availability.length === 0 ||
        availability.includes(productAvailability(product).status)) &&
      specFilters.every(([key, filter]) =>
        matchesSpec(product.specs[key], filter),
      ),
  );
}

type RangeFilter = Extract<SpecFilter, { kind: "range" }>;

function finite(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

/** Drops non-finite bounds and swaps reversed ones. */
function sanitizeRange(filter: RangeFilter): RangeFilter {
  let min = finite(filter.min);
  let max = finite(filter.max);
  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }
  const range: RangeFilter = { kind: "range" };
  if (min !== undefined) range.min = min;
  if (max !== undefined) range.max = max;
  return range;
}

/**
 * Keeps only the spec filters the category can apply: known, filterable keys
 * whose filter fits the spec kind. Filters come from the URL, so bad input is
 * dropped or repaired (non-finite bounds removed, reversed bounds swapped),
 * never thrown.
 */
export function sanitizeFilters(
  filters: ProductFilters,
  category: Category,
): ProductFilters {
  const { specs, ...rest } = filters;
  if (specs === undefined) return rest;

  const definitions = new Map(
    category.specSchema.map((definition) => [definition.key, definition]),
  );
  const kept: Record<string, SpecFilter> = {};
  for (const [key, filter] of Object.entries(specs)) {
    const definition = definitions.get(key);
    if (
      !definition?.filterable ||
      FILTER_KIND[definition.kind] !== filter.kind
    ) {
      continue;
    }
    kept[key] = filter.kind === "range" ? sanitizeRange(filter) : filter;
  }
  return { ...rest, specs: kept };
}

const NAME_COLLATOR = new Intl.Collator("es-PE", { sensitivity: "base" });

/** A sorted copy; ties keep catalog order. */
export function sortProducts(
  products: readonly Product[],
  sort: ProductSort,
): Product[] {
  const copy = [...products];
  switch (sort) {
    case "featured":
      return copy;
    case "price_asc":
      return copy.sort((a, b) => productPrice(a).from - productPrice(b).from);
    case "price_desc":
      return copy.sort((a, b) => productPrice(b).from - productPrice(a).from);
    case "name_asc":
      return copy.sort((a, b) => NAME_COLLATOR.compare(a.name, b.name));
  }
}

function clampInteger(value: number, min: number, max: number): number {
  const whole = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(Math.max(whole, min), max);
}

/**
 * One page of `items`. The page size is clamped to 1..100 and the page to the
 * existing pages (an empty list has one empty page). Without pagination every
 * item comes back as page 1.
 */
export function paginate<T>(
  items: readonly T[],
  pagination?: Pagination,
): Page<T> {
  const total = items.length;
  if (pagination === undefined) {
    return { items: [...items], total, page: 1, pageSize: total, pageCount: 1 };
  }
  const pageSize = clampInteger(pagination.pageSize, 1, MAX_PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = clampInteger(pagination.page, 1, pageCount);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    pageCount,
  };
}
