import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { IN_STOCK, placeholderImage } from "./helpers";

const category = CATEGORIES.cables;
const LENGTH = { key: "length", label: "Longitud" };

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const cables: Product[] = [
  {
    slug: "anker-prime-cable-usb-c-240w-trenzado",
    name: "Prime Cable USB-C a USB-C 240W trenzado",
    model: "A88E2",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "Cable USB-C certificado USB-IF que soporta hasta 240 W, con trenzado de material reciclado probado para más de 300 000 dobleces.",
    images: [
      placeholderImage(category, "Prime Cable USB-C a USB-C 240W trenzado"),
    ],
    specs: {
      connectors: "USB-C a USB-C",
      maxPower: 240,
      maxCurrent: 5,
      dataSpeed: 480,
      certification: "USB-IF",
      jacket: "Trenzado de material reciclado",
      bendLifespan: 300000,
    },
    options: [LENGTH],
    // price: estimated (the only Peru reference, S/ 188.90 on a marketplace,
    // looks overpriced for a USB 2.0 cable)
    variants: [
      {
        sku: "ANK-A88E2-090",
        options: { length: "0.9 m" },
        price: 8990,
        availability: IN_STOCK,
      },
      {
        sku: "ANK-A88E2-180",
        options: { length: "1.8 m" },
        price: 9990,
        availability: IN_STOCK,
      },
    ],
    tags: ["usb-c", "240 w", "laptop", "trenzado", "usb-if"],
  },
  {
    slug: "ugreen-cable-usb-c-a-lightning-mfi-trenzado",
    name: "Cable USB-C a Lightning MFi trenzado",
    model: "60759 / 60761",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "Cable con certificación MFi de Apple para cargar rápido iPhone y iPad con conector Lightning, con recubrimiento de nailon trenzado.",
    images: [
      placeholderImage(category, "Cable USB-C a Lightning MFi trenzado"),
    ],
    specs: {
      connectors: "USB-C a Lightning",
      maxCurrent: 3,
      dataSpeed: 480,
      certification: "Apple MFi",
      jacket: "Nailon trenzado",
    },
    options: [LENGTH],
    variants: [
      {
        sku: "UGR-60759",
        options: { length: "1 m" },
        price: 5490,
        availability: IN_STOCK,
      },
      {
        sku: "UGR-60761",
        options: { length: "2 m" },
        price: 7890,
        availability: IN_STOCK,
      },
    ],
    tags: ["lightning", "iphone", "mfi", "carga rápida", "trenzado"],
  },
];
