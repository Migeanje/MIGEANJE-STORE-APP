import { type AvailabilityStatus, isAvailabilityStatus } from "./availability";
import type { Category, SpecDefinition, SpecKind, SpecValue } from "./category";
import type { CategoryFacets } from "./facets";
import { slugSchema } from "./primitives";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** Trimmed, non-blank, distinct strings that pass `accept`; the rest is dropped. */
function distinctStrings(
  values: readonly unknown[],
  accept: (value: string) => boolean,
): string[] {
  const kept = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed !== "" && accept(trimmed)) kept.add(trimmed);
  }
  return [...kept];
}

/** Drops non-numeric and non-finite bounds and swaps reversed ones. */
function sanitizeRange(rawMin: unknown, rawMax: unknown): RangeFilter | null {
  let min = finite(rawMin);
  let max = finite(rawMax);
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined && min > max) {
    [min, max] = [max, min];
  }
  const range: RangeFilter = { kind: "range" };
  if (min !== undefined) range.min = min;
  if (max !== undefined) range.max = max;
  return range;
}

/**
 * One spec filter, or null when it cannot apply: wrong shape, wrong kind for
 * the spec, nothing left after cleaning, or (with facets) no product offers it.
 */
function sanitizeSpecFilter(
  raw: unknown,
  definition: SpecDefinition,
  facets: CategoryFacets | undefined,
): SpecFilter | null {
  if (!isRecord(raw) || raw.kind !== FILTER_KIND[definition.kind]) return null;
  const facet = facets?.specs.find(({ key }) => key === definition.key);
  if (facets !== undefined && facet === undefined) return null;

  switch (raw.kind) {
    case "range":
      return sanitizeRange(raw.min, raw.max);
    case "options": {
      if (!Array.isArray(raw.values)) return null;
      const known =
        facet?.kind === "options"
          ? new Set(facet.options.map(({ value }) => value))
          : undefined;
      const values = distinctStrings(
        raw.values,
        (value) => known === undefined || known.has(value),
      );
      return values.length === 0 ? null : { kind: "options", values };
    }
    default:
      return { kind: "toggle" };
  }
}

function isSlug(value: string): boolean {
  return slugSchema.safeParse(value).success;
}

/**
 * Keeps only the filters the category can apply. Filters come from the URL,
 * so this takes untrusted input and never throws: anything malformed (null
 * entries, wrong types, unknown statuses, non-slug brands, unknown or
 * non-filterable spec keys, filters of the wrong kind) is dropped, values are
 * trimmed and deduped, non-finite bounds are removed and reversed bounds
 * swapped. Spec filters left empty are dropped; a `brands`, `availability` or
 * `specs` field given with the right shape stays, even if empty.
 *
 * With `facets` (computed from the whole category), brands, option values and
 * spec filters must also be ones the category's products offer.
 */
export function sanitizeFilters(
  filters: unknown,
  category: Category,
  facets?: CategoryFacets,
): ProductFilters {
  if (!isRecord(filters)) return {};
  const sanitized: ProductFilters = {};

  if (Array.isArray(filters.brands)) {
    const known = facets && new Set(facets.brands.map(({ value }) => value));
    sanitized.brands = distinctStrings(
      filters.brands,
      (slug) => isSlug(slug) && (known === undefined || known.has(slug)),
    );
  }
  if (Array.isArray(filters.availability)) {
    sanitized.availability = distinctStrings(
      filters.availability,
      () => true,
    ).filter(isAvailabilityStatus);
  }
  if (isRecord(filters.specs)) {
    const specs: Record<string, SpecFilter> = {};
    for (const definition of category.specSchema) {
      if (!definition.filterable) continue;
      if (!Object.hasOwn(filters.specs, definition.key)) continue;
      const filter = sanitizeSpecFilter(
        filters.specs[definition.key],
        definition,
        facets,
      );
      if (filter !== null) specs[definition.key] = filter;
    }
    sanitized.specs = specs;
  }
  return sanitized;
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
 * item comes back as page 1, with a page size of the total (at least 1, so
 * the page size is never 0).
 */
export function paginate<T>(
  items: readonly T[],
  pagination?: Pagination,
): Page<T> {
  const total = items.length;
  if (pagination === undefined) {
    return {
      items: [...items],
      total,
      page: 1,
      pageSize: Math.max(1, total),
      pageCount: 1,
    };
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
