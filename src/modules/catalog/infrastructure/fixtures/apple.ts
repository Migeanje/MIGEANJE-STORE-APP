import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product, Variant } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { COLOR, placeholderImage, UNAVAILABLE } from "./helpers";

// Apple group: a future line (regime B). Shown as "Avísame" (unavailable);
// prices are Peru references (iShop) to show what to expect.
// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).

const MACBOOK_COLORS = [
  ["Azul cielo", "SKY"],
  ["Plata", "SLV"],
  ["Blanco estelar", "STL"],
  ["Medianoche", "MID"],
] as const;

const MACBOOK_CONFIGS = [
  {
    code: "G8-16-512",
    chip: "M5 (CPU de 10 núcleos, GPU de 8 núcleos)",
    memory: "16 GB",
    storage: "512 GB",
    price: 649890,
  },
  {
    code: "G10-24-1TB",
    chip: "M5 (CPU de 10 núcleos, GPU de 10 núcleos)",
    memory: "24 GB",
    storage: "1 TB",
    // price: estimated (US upgrade difference converted at the base model's
    // Peru/US ratio)
    price: 889890,
  },
] as const;

const IPAD_COLORS = [
  ["Azul", "BLU"],
  ["Morado", "PRP"],
  ["Blanco estelar", "STL"],
  ["Gris espacial", "GRY"],
] as const;

const IPAD_STORAGE = [
  { storage: "128 GB", code: "128", price: 339890 },
  // price: estimated (US step between storage tiers converted at the 128 GB
  // model's Peru/US ratio)
  { storage: "256 GB", code: "256", price: 399890 },
  // price: estimated
  { storage: "512 GB", code: "512", price: 509890 },
  // price: estimated
  { storage: "1 TB", code: "1TB", price: 619890 },
] as const;

const macbookVariants: Variant[] = MACBOOK_CONFIGS.flatMap(
  ({ code, price, ...config }) =>
    MACBOOK_COLORS.map(([color, colorCode]) => ({
      sku: `APL-MBA13-M5-${code}-${colorCode}`,
      options: { ...config, color },
      price,
      availability: UNAVAILABLE,
    })),
);

const ipadVariants: Variant[] = IPAD_STORAGE.flatMap(
  ({ storage, code, price }) =>
    IPAD_COLORS.map(([color, colorCode]) => ({
      sku: `APL-IPADAIR11-M4-${code}-${colorCode}`,
      options: { storage, color },
      price,
      availability: UNAVAILABLE,
    })),
);

export const apple: Product[] = [
  {
    slug: "macbook-air-13-m5",
    name: "MacBook Air de 13 pulgadas (M5)",
    brand: BRANDS.apple,
    category: categoryRef(CATEGORIES.laptops),
    summary:
      "Laptop delgada de 1.23 kg con chip M5, pantalla de 13.6 pulgadas, hasta 18 horas de batería, MagSafe 3 y Wi-Fi 7.",
    images: [
      placeholderImage(CATEGORIES.laptops, "MacBook Air de 13 pulgadas (M5)"),
    ],
    specs: {
      chip: "Apple M5",
      cpuCores: 10,
      screenSize: 13.6,
      resolution: "2560 × 1664",
      battery: 18,
      weight: 1.23,
      ports: "MagSafe 3 y 2 × Thunderbolt 4",
      wifi: "Wi-Fi 7",
    },
    options: [
      { key: "chip", label: "Chip" },
      { key: "memory", label: "Memoria unificada" },
      { key: "storage", label: "Almacenamiento" },
      COLOR,
    ],
    variants: macbookVariants,
    tags: ["macbook", "laptop", "macos", "apple silicon"],
  },
  {
    slug: "ipad-air-11-m4",
    name: "iPad Air de 11 pulgadas (M4)",
    brand: BRANDS.apple,
    category: categoryRef(CATEGORIES.tablets),
    summary:
      "iPad Air con chip M4, 12 GB de memoria, Wi-Fi 7 y compatibilidad con el Apple Pencil Pro.",
    images: [
      placeholderImage(CATEGORIES.tablets, "iPad Air de 11 pulgadas (M4)"),
    ],
    specs: {
      chip: "Apple M4",
      cpuCores: 8,
      gpuCores: 9,
      memory: 12,
      screenSize: 11,
      wifi: "Wi-Fi 7",
      pencil: "Apple Pencil Pro",
    },
    options: [{ key: "storage", label: "Almacenamiento" }, COLOR],
    variants: ipadVariants,
    tags: ["ipad", "tablet", "ipados", "apple pencil"],
  },
  {
    slug: "airpods-pro-3",
    name: "AirPods Pro 3",
    model: "MFHP4",
    brand: BRANDS.apple,
    category: categoryRef(CATEGORIES.audio),
    summary:
      "Audífonos in-ear con chip H2, cancelación de ruido activa, sensor de frecuencia cardiaca y estuche con carga MagSafe, Qi y USB-C.",
    images: [placeholderImage(CATEGORIES.audio, "AirPods Pro 3")],
    specs: {
      formFactor: "In-ear",
      anc: true,
      ldac: false,
      batteryAnc: 8,
      batteryWithCase: 24,
      heartRate: true,
      waterResistance: "IP57",
      weight: "5.55 g por audífono",
    },
    options: [],
    variants: [
      {
        sku: "APL-MFHP4",
        options: {},
        price: 119890,
        availability: UNAVAILABLE,
      },
    ],
    tags: ["airpods", "audífonos", "anc", "iphone", "inalámbricos"],
  },
];
