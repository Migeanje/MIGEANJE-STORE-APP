import * as z from "zod";
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from "@/modules/catalog/domain/availability";
import {
  type Category,
  orderedSpecs,
  type SpecKind,
} from "@/modules/catalog/domain/category";
import { slugSchema } from "@/modules/catalog/domain/primitives";
import {
  type ProductFilters,
  type ProductSort,
  type SpecFilter,
  sanitizeFilters,
} from "@/modules/catalog/domain/product-query";

/*
 * The URL boundary of the discovery pages: Spanish query params <-> domain
 * queries. Everything here reads untrusted input, so it never throws on bad
 * params: unknown keys and invalid values are dropped.
 *
 * Category pages:
 *   marca=anker&marca=ugreen        brand slugs (repeated param)
 *   disponibilidad=en-stock         en-stock | en-importacion | agotado
 *   potencia=60-140                 number specs: min-max, "60-", "-140" or "65"
 *   conectores=USB-C+a+USB-C        text and list specs: repeated values
 *   pantalla=si                     boolean specs
 *   orden=precio-asc                relevancia | precio-asc | precio-desc
 *   pagina=2                        1-based page
 *
 * The no-JavaScript filter form submits number specs as two fields,
 * `potencia-desde` and `potencia-hasta`; the parser accepts both forms and
 * the serializer always writes the canonical `potencia=60-140`.
 */

export const BRAND_PARAM = "marca";
export const AVAILABILITY_PARAM = "disponibilidad";
export const SORT_PARAM = "orden";
export const PAGE_PARAM = "pagina";
export const SEARCH_PARAM = "q";

/** Fixed params: no spec param name may use them. */
export const RESERVED_PARAMS: readonly string[] = [
  BRAND_PARAM,
  AVAILABILITY_PARAM,
  SORT_PARAM,
  PAGE_PARAM,
  SEARCH_PARAM,
];

/** Suffixes of the two range fields of the no-JavaScript form. */
export const RANGE_FROM_SUFFIX = "-desde";
export const RANGE_TO_SUFFIX = "-hasta";
/** Value of a checked boolean spec. */
export const TOGGLE_VALUE = "si";

export const AVAILABILITY_PARAM_VALUES = {
  in_stock: "en-stock",
  backorder: "en-importacion",
  unavailable: "agotado",
} as const satisfies Record<AvailabilityStatus, string>;

/** The sorts the category page offers, in menu order, with their labels. */
export const CATEGORY_SORTS = [
  { param: "relevancia", sort: "featured", label: "Relevancia" },
  { param: "precio-asc", sort: "price_asc", label: "Precio: menor a mayor" },
  { param: "precio-desc", sort: "price_desc", label: "Precio: mayor a menor" },
] as const satisfies readonly {
  param: string;
  sort: ProductSort;
  label: string;
}[];

export type CategorySortParam = (typeof CATEGORY_SORTS)[number]["param"];

/**
 * Spanish param names for the spec keys of the catalog (keys are shared across
 * categories and mean the same everywhere). A filterable spec without an entry
 * falls back to its slugified label. Names must be unique within a category
 * and must not clash with RESERVED_PARAMS; `specParams` fails loudly if they do.
 *
 * | Spec key        | Param             | Categories                          |
 * |-----------------|-------------------|-------------------------------------|
 * | maxPower        | potencia          | cargadores, power-banks, cables     |
 * | usbCPorts       | puertos-usb-c     | cargadores                          |
 * | display         | pantalla          | cargadores, power-banks             |
 * | capacity        | capacidad         | power-banks                         |
 * | wireless        | inalambrica       | power-banks                         |
 * | connectors      | conectores        | cables                              |
 * | certification   | certificacion     | cables                              |
 * | portCount       | puertos           | hubs-y-docks                        |
 * | hostConnection  | conexion          | hubs-y-docks                        |
 * | laptopCharging  | carga-laptop      | hubs-y-docks                        |
 * | devices         | equipos           | carga-inalambrica                   |
 * | standard        | estandar          | carga-inalambrica                   |
 * | maxPhonePower   | potencia-celular  | carga-inalambrica                   |
 * | adapterIncluded | adaptador         | carga-inalambrica                   |
 * | formFactor      | tipo              | audio                               |
 * | anc             | cancelacion-ruido | audio                               |
 * | ldac            | ldac              | audio                               |
 * | type            | tipo              | almacenamiento                      |
 * | maxSpeed        | velocidad         | almacenamiento                      |
 * | chip            | chip              | laptops, tablets                    |
 * | screenSize      | pantalla          | laptops, tablets                    |
 */
export const SPEC_PARAM_NAMES: Readonly<Record<string, string>> = {
  maxPower: "potencia",
  usbCPorts: "puertos-usb-c",
  display: "pantalla",
  capacity: "capacidad",
  wireless: "inalambrica",
  connectors: "conectores",
  certification: "certificacion",
  portCount: "puertos",
  hostConnection: "conexion",
  laptopCharging: "carga-laptop",
  devices: "equipos",
  standard: "estandar",
  maxPhonePower: "potencia-celular",
  adapterIncluded: "adaptador",
  formFactor: "tipo",
  anc: "cancelacion-ruido",
  ldac: "ldac",
  type: "tipo",
  maxSpeed: "velocidad",
  chip: "chip",
  screenSize: "pantalla",
};

const FILTER_KIND = {
  number: "range",
  text: "options",
  list: "options",
  boolean: "toggle",
} as const satisfies Record<SpecKind, SpecFilter["kind"]>;

/** A filterable spec with its param name. */
export type SpecParam = {
  key: string;
  name: string;
  kind: SpecFilter["kind"];
};

/** "Cancelación de ruido" -> "cancelacion-de-ruido". */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The category's filterable specs in display order, with their param names.
 * Throws when two of them share a name (or a range field name) or one uses a
 * reserved name: that is a catalog configuration bug, not user input.
 */
export function specParams(category: Category): SpecParam[] {
  const params = orderedSpecs(category)
    .filter((definition) => definition.filterable)
    .map((definition) => ({
      key: definition.key,
      name: SPEC_PARAM_NAMES[definition.key] ?? slugify(definition.label),
      kind: FILTER_KIND[definition.kind],
    }));

  const taken = new Map<string, string>(
    RESERVED_PARAMS.map((name) => [name, "a fixed param"]),
  );
  for (const { key, name } of params) {
    for (const used of [
      name,
      `${name}${RANGE_FROM_SUFFIX}`,
      `${name}${RANGE_TO_SUFFIX}`,
    ]) {
      const owner = taken.get(used);
      if (owner !== undefined) {
        throw new Error(
          `Category "${category.slug}": spec "${key}" uses the param "${used}", already used by ${owner}. Add a distinct name to SPEC_PARAM_NAMES.`,
        );
      }
      taken.set(used, `spec "${key}"`);
    }
  }
  return params;
}

/** The query a category page renders. */
export type CategoryQuery = {
  filters: ProductFilters;
  sort: ProductSort;
  page: number;
};

/** What Next.js passes as `searchParams`, or a URLSearchParams. */
export type SearchParamsInput =
  | URLSearchParams
  | Readonly<Record<string, string | string[] | undefined>>;

const MAX_OPTION_VALUES = 20;

const DECIMAL = String.raw`\d{1,12}(?:\.\d{1,6})?`;

const numberSchema = z
  .string()
  .regex(new RegExp(`^${DECIMAL}$`))
  .transform(Number);

/** "60-140", "60-", "-140" or "65" (exact). Non-negative decimals only. */
const rangeSchema = z
  .string()
  .regex(new RegExp(`^(?:(${DECIMAL})?-(${DECIMAL})?|${DECIMAL})$`))
  .transform((value) => {
    if (!value.includes("-")) return { min: Number(value), max: Number(value) };
    const [min, max] = value.split("-");
    return {
      min: min === "" ? undefined : Number(min),
      max: max === "" ? undefined : Number(max),
    };
  })
  .refine(({ min, max }) => min !== undefined || max !== undefined);

const optionSchema = z.string().trim().min(1).max(100);

const availabilityParamSchema = z.enum(
  Object.values(AVAILABILITY_PARAM_VALUES) as [string, ...string[]],
);

const sortParamSchema = z.enum(
  CATEGORY_SORTS.map(({ param }) => param) as [
    CategorySortParam,
    ...CategorySortParam[],
  ],
);

const pageSchema = z
  .string()
  .regex(/^\d{1,4}$/)
  .transform(Number)
  .pipe(z.int().min(1));

/** Every value of `key`, as strings, from either input shape. */
function readAll(input: SearchParamsInput, key: string): string[] {
  if (input instanceof URLSearchParams) return input.getAll(key);
  if (!Object.hasOwn(input, key)) return [];
  const value = input[key];
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (entry): entry is string => typeof entry === "string",
  );
}

/** The values that parse, in order. */
function validValues<T>(values: readonly string[], schema: z.ZodType<T>): T[] {
  return values.flatMap((value) => {
    const result = schema.safeParse(value);
    return result.success ? [result.data] : [];
  });
}

function firstValid<T>(
  values: readonly string[],
  schema: z.ZodType<T>,
): T | undefined {
  return validValues(values, schema)[0];
}

function readSpecFilter(
  input: SearchParamsInput,
  { name, kind }: SpecParam,
): SpecFilter | undefined {
  switch (kind) {
    case "range": {
      const canonical = firstValid(readAll(input, name), rangeSchema);
      if (canonical !== undefined) return { kind, ...canonical };
      const min = firstValid(
        readAll(input, `${name}${RANGE_FROM_SUFFIX}`),
        numberSchema,
      );
      const max = firstValid(
        readAll(input, `${name}${RANGE_TO_SUFFIX}`),
        numberSchema,
      );
      return min === undefined && max === undefined
        ? undefined
        : { kind, min, max };
    }
    case "options": {
      const values = validValues(readAll(input, name), optionSchema);
      return values.length === 0
        ? undefined
        : { kind, values: values.slice(0, MAX_OPTION_VALUES) };
    }
    case "toggle":
      return readAll(input, name).includes(TOGGLE_VALUE) ? { kind } : undefined;
  }
}

const AVAILABILITY_BY_PARAM = new Map<string, AvailabilityStatus>(
  AVAILABILITY_STATUSES.map((status) => [
    AVAILABILITY_PARAM_VALUES[status],
    status,
  ]),
);

const SORT_BY_PARAM = new Map<string, ProductSort>(
  CATEGORY_SORTS.map(({ param, sort }) => [param, sort]),
);

/**
 * Reads a category page URL into a domain query. Unknown params and invalid
 * values are dropped (never thrown); the result is then cleaned by the domain
 * `sanitizeFilters`, so reversed ranges are swapped and values deduped. Only
 * filters with a value appear in the result.
 */
export function parseCategorySearchParams(
  input: SearchParamsInput,
  category: Category,
): CategoryQuery {
  const raw: {
    brands?: string[];
    availability?: AvailabilityStatus[];
    specs?: Record<string, SpecFilter>;
  } = {};

  const brands = validValues(readAll(input, BRAND_PARAM), slugSchema);
  if (brands.length > 0) raw.brands = brands;

  const availability = validValues(
    readAll(input, AVAILABILITY_PARAM),
    availabilityParamSchema,
  ).flatMap((param) => AVAILABILITY_BY_PARAM.get(param) ?? []);
  if (availability.length > 0) raw.availability = availability;

  const specs: Record<string, SpecFilter> = {};
  for (const param of specParams(category)) {
    const filter = readSpecFilter(input, param);
    if (filter !== undefined) specs[param.key] = filter;
  }
  if (Object.keys(specs).length > 0) raw.specs = specs;

  const sortParam = firstValid(readAll(input, SORT_PARAM), sortParamSchema);
  return {
    filters: sanitizeFilters(raw, category),
    sort: (sortParam && SORT_BY_PARAM.get(sortParam)) ?? "featured",
    page: firstValid(readAll(input, PAGE_PARAM), pageSchema) ?? 1,
  };
}

function formatRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined && min === max) {
    return `${min}-${max}`;
  }
  return `${min ?? ""}-${max ?? ""}`;
}

/**
 * The canonical query string of a category query: brands (sorted),
 * availability (best first), specs in display order (option values sorted),
 * then sort and page. Empty filters, the default sort and page 1 are omitted,
 * so equal queries always produce equal URLs.
 */
export function categorySearchParams(
  { filters, sort, page }: CategoryQuery,
  category: Category,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const brand of [...new Set(filters.brands ?? [])].sort()) {
    params.append(BRAND_PARAM, brand);
  }
  const statuses = new Set(filters.availability ?? []);
  for (const status of AVAILABILITY_STATUSES) {
    if (statuses.has(status)) {
      params.append(AVAILABILITY_PARAM, AVAILABILITY_PARAM_VALUES[status]);
    }
  }
  for (const { key, name } of specParams(category)) {
    const filter = filters.specs?.[key];
    if (filter === undefined) continue;
    switch (filter.kind) {
      case "range":
        if (filter.min !== undefined || filter.max !== undefined) {
          params.append(name, formatRange(filter.min, filter.max));
        }
        break;
      case "options":
        for (const value of [...new Set(filter.values)].sort()) {
          params.append(name, value);
        }
        break;
      case "toggle":
        params.append(name, TOGGLE_VALUE);
        break;
    }
  }
  const sortParam = CATEGORY_SORTS.find((entry) => entry.sort === sort)?.param;
  if (sortParam !== undefined && sortParam !== "relevancia") {
    params.append(SORT_PARAM, sortParam);
  }
  if (Number.isSafeInteger(page) && page > 1) {
    params.append(PAGE_PARAM, String(page));
  }
  return params;
}

export function categoryPath(slug: string): string {
  return `/categorias/${slug}`;
}

export function brandPath(slug: string): string {
  return `/marcas/${slug}`;
}

export function productPath(slug: string): string {
  return `/productos/${slug}`;
}

export const SEARCH_PATH = "/buscar";

/** The category page URL for a query, with its canonical query string. */
export function categoryHref(category: Category, query: CategoryQuery): string {
  const search = categorySearchParams(query, category).toString();
  const path = categoryPath(category.slug);
  return search === "" ? path : `${path}?${search}`;
}

/** The raw `q` of the search page (first value); the use case trims it. */
export function searchQueryParam(input: SearchParamsInput): string {
  return readAll(input, SEARCH_PARAM)[0] ?? "";
}
