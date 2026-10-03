// Test data for the catalog module: small, hand-written and independent of
// the mock fixtures, so domain and use-case tests stay readable.
import type { Brand } from "@/modules/catalog/domain/brand";
import type { Catalog } from "@/modules/catalog/domain/catalog";
import { type Category, categoryRef } from "@/modules/catalog/domain/category";
import type { Product, Variant } from "@/modules/catalog/domain/product";

export const ANKER: Brand = { slug: "anker", name: "Anker" };
export const UGREEN: Brand = { slug: "ugreen", name: "UGREEN" };

export const CHARGERS: Category = {
  slug: "cargadores",
  name: "Cargadores",
  specSchema: [
    {
      key: "maxPower",
      label: "Potencia máxima",
      unit: "W",
      kind: "number",
      filterable: true,
      comparable: true,
      order: 10,
    },
    {
      key: "ports",
      label: "Puertos",
      kind: "list",
      filterable: true,
      comparable: true,
      order: 20,
    },
    {
      key: "technology",
      label: "Tecnología",
      kind: "text",
      filterable: true,
      comparable: true,
      order: 30,
    },
    {
      key: "display",
      label: "Pantalla",
      kind: "boolean",
      filterable: true,
      comparable: true,
      order: 40,
    },
    {
      key: "weight",
      label: "Peso",
      unit: "g",
      kind: "number",
      filterable: false,
      comparable: true,
      order: 50,
    },
    {
      key: "inBox",
      label: "Contenido de la caja",
      kind: "text",
      filterable: false,
      comparable: false,
      order: 60,
    },
  ],
};

export const CABLES: Category = {
  slug: "cables",
  name: "Cables",
  specSchema: [
    {
      key: "length",
      label: "Longitud",
      unit: "m",
      kind: "number",
      filterable: true,
      comparable: true,
      order: 10,
    },
  ],
};

export function buildVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    sku: "TEST-SKU-1",
    options: {},
    price: 9990,
    availability: { status: "in_stock" },
    ...overrides,
  };
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: "cargador-de-prueba",
    name: "Cargador de prueba",
    brand: ANKER,
    category: categoryRef(CHARGERS),
    summary: "Un cargador para pruebas.",
    images: [
      {
        src: "/mock/products/cargadores.svg",
        alt: "Imagen referencial de un cargador",
        width: 800,
        height: 800,
      },
    ],
    specs: {},
    options: [],
    variants: [buildVariant()],
    tags: [],
    ...overrides,
  };
}

export const BACKORDER_15_20 = {
  status: "backorder",
  leadTimeDays: { min: 15, max: 20 },
} as const;

/**
 * Four chargers (two brands, every availability) and one cable. Prices:
 * Básico 4990 (unavailable), Nexode 12990, Prime 18990, Nano 24890.
 */
export function buildTestCatalog(): Catalog {
  return {
    categories: [CHARGERS, CABLES],
    brands: [ANKER, UGREEN],
    products: [
      buildProduct({
        slug: "nano-45w",
        name: "Nano Charger 45W",
        model: "A121D",
        tags: ["carga rápida", "gan"],
        specs: {
          maxPower: 45,
          ports: ["USB-C"],
          technology: "GaN",
          display: true,
          weight: 75,
        },
        options: [{ key: "color", label: "Color" }],
        variants: [
          buildVariant({
            sku: "NANO-45-WHT",
            options: { color: "Blanco" },
            price: 24890,
            availability: BACKORDER_15_20,
          }),
          buildVariant({
            sku: "NANO-45-BLK",
            options: { color: "Negro" },
            price: 24890,
            availability: {
              status: "backorder",
              leadTimeDays: { min: 10, max: 12 },
            },
          }),
        ],
      }),
      buildProduct({
        slug: "prime-100w",
        name: "Prime Charger 100W",
        specs: {
          maxPower: 100,
          ports: ["USB-C", "USB-A"],
          technology: "GaN",
          display: false,
          weight: 170,
        },
        variants: [buildVariant({ sku: "PRIME-100", price: 18990 })],
      }),
      buildProduct({
        slug: "nexode-65w",
        name: "Nexode Cargador 65W",
        brand: UGREEN,
        specs: {
          maxPower: 65,
          ports: ["USB-C", "USB-A"],
          technology: "GaN",
          display: false,
        },
        variants: [
          buildVariant({ sku: "NEXODE-65", price: 12990, compareAt: 15990 }),
        ],
      }),
      buildProduct({
        slug: "cargador-basico-20w",
        name: "Cargador Básico 20W",
        brand: UGREEN,
        specs: { maxPower: 20, ports: ["USB-C"], technology: "Silicio" },
        variants: [
          buildVariant({
            sku: "BASIC-20",
            price: 4990,
            availability: { status: "unavailable" },
          }),
        ],
      }),
      buildProduct({
        slug: "cable-usb-c-1m",
        name: "Cable USB-C 1 m",
        category: categoryRef(CABLES),
        tags: ["trenzado"],
        specs: { length: 1 },
        variants: [buildVariant({ sku: "CABLE-C-1M", price: 3990 })],
      }),
    ],
  };
}
