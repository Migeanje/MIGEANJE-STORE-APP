import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { BACKORDER, placeholderImage } from "./helpers";

const category = CATEGORIES.hubsAndDocks;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const hubsAndDocks: Product[] = [
  {
    slug: "ugreen-revodok-pro-210-10-en-1",
    name: "Revodok Pro 210 Hub USB-C 10 en 1",
    model: "15534",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "Hub USB-C con dos HDMI, Ethernet Gigabit, lectores SD y microSD y carga de hasta 85 W a tu laptop.",
    images: [placeholderImage(category, "Revodok Pro 210 Hub USB-C 10 en 1")],
    specs: {
      portCount: 10,
      hostConnection: "USB-C",
      videoOutputs: "2 × HDMI",
      maxResolution: "4K a 60 Hz en dos pantallas u 8K a 30 Hz en una",
      laptopCharging: 85,
      maxDataSpeed: 5,
      ethernet: 1,
      cardReader: true,
      adapterIncluded: false,
      dimensions: "140 × 57 × 16 mm",
    },
    options: [],
    // Peru reference S/ 199 (out of stock locally): backorder.
    variants: [
      { sku: "UGR-15534", options: {}, price: 19890, availability: BACKORDER },
    ],
    expertReview: {
      verdict:
        "Excelente hub para Windows y para una pantalla externa en Mac. Ojo: en macOS las dos HDMI muestran la misma imagen.",
      forWhom: [
        "Usas una laptop con Windows y quieres dos monitores extendidos",
        "Tienes una Mac y te basta con un monitor externo, más Ethernet y lector de tarjetas",
      ],
      notFor: [
        "Quieres dos monitores extendidos en tu Mac: macOS no soporta MST, así que ambas pantallas muestran la misma imagen",
        "Necesitas transferir archivos grandes muy rápido: sus puertos USB llegan a 5 Gbps",
      ],
      rubric: [
        {
          criterion: "Conectividad",
          score: 5,
          note: "Dos HDMI, Ethernet, SD, microSD y puertos USB-C y USB-A en un solo cable.",
        },
        {
          criterion: "Compatibilidad con Mac",
          score: 2,
          note: "En macOS las dos HDMI duplican la misma imagen; solo una pantalla extendida.",
        },
        {
          criterion: "Carga a tu laptop",
          score: 4,
          note: "Recibe hasta 100 W de tu cargador y entrega hasta 85 W a la laptop.",
        },
        {
          criterion: "Velocidad de datos",
          score: 3,
          note: "5 Gbps: suficiente para memorias y discos externos comunes.",
        },
      ],
    },
    tags: ["hub", "usb-c", "hdmi", "doble monitor", "ethernet", "windows"],
  },
  {
    slug: "ugreen-revodok-max-213-thunderbolt-4-13-en-1",
    name: "Revodok Max 213 Dock Thunderbolt 4 13 en 1",
    model: "25054A",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "Dock Thunderbolt 4 de escritorio con tres puertos de 40 Gbps, DisplayPort 1.4, Ethernet de 2.5 Gb y adaptador GaN de 180 W incluido.",
    images: [
      placeholderImage(category, "Revodok Max 213 Dock Thunderbolt 4 13 en 1"),
    ],
    specs: {
      portCount: 13,
      hostConnection: "Thunderbolt 4",
      videoOutputs: "1 × DisplayPort 1.4 y puertos Thunderbolt 4",
      laptopCharging: 90,
      maxDataSpeed: 40,
      ethernet: 2.5,
      cardReader: true,
      adapterIncluded: true,
    },
    options: [],
    variants: [
      {
        sku: "UGR-25054A",
        options: {},
        // price: estimated (no Peru reference found)
        price: 94990,
        availability: BACKORDER,
      },
    ],
    tags: ["dock", "thunderbolt 4", "displayport", "ethernet", "escritorio"],
  },
];
