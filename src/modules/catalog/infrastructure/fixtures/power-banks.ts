import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { COLOR, colorVariants, IN_STOCK, placeholderImage } from "./helpers";

const category = CATEGORIES.powerBanks;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const powerBanks: Product[] = [
  {
    slug: "anker-maggo-power-bank-10k-slim",
    name: "MagGo Power Bank 10K Slim",
    model: "A1664",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "Batería magnética delgada con Qi2 de 15 W: se pega a tu iPhone y lo carga sin cables. También carga por USB-C a 30 W.",
    images: [placeholderImage(category, "MagGo Power Bank 10K Slim")],
    specs: {
      capacity: 10000,
      maxPortPower: 30,
      ports: "1 × USB-C (entrada y salida)",
      inputPower: 30,
      wireless: true,
      wirelessPower: 15,
      dimensions: "104 × 70.6 × 14.7 mm",
      weight: 215.9,
    },
    options: [COLOR],
    variants: colorVariants(
      "ANK-A1664",
      [
        ["Negro", "BLK"],
        ["Blanco", "WHT"],
        ["Verde azulado", "TEA"],
        ["Rosado", "PNK"],
      ],
      { price: 19990, availability: IN_STOCK },
    ),
    tags: ["magsafe", "qi2", "inalámbrico", "iphone", "magnético"],
  },
  {
    slug: "anker-prime-power-bank-20k-220w",
    name: "Prime Power Bank 20K 220W",
    model: "A110B",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "20 100 mAh y 220 W en total para cargar una laptop y dos equipos más. Se recarga a 100 W y muestra todo en su pantalla.",
    images: [placeholderImage(category, "Prime Power Bank 20K 220W")],
    specs: {
      capacity: 20100,
      maxPower: 220,
      maxPortPower: 140,
      ports: "2 × USB-C (hasta 140 W), 1 × USB-A (22.5 W)",
      inputPower: 100,
      wireless: false,
      display: true,
      dimensions: "44 × 50 × 147 mm",
      weight: 510,
    },
    options: [],
    variants: [
      { sku: "ANK-A110B", options: {}, price: 64890, availability: IN_STOCK },
    ],
    tags: ["laptop", "usb-c", "pd 3.1", "viaje"],
  },
  {
    slug: "ugreen-nexode-power-bank-25000mah-200w",
    name: "Nexode Power Bank 25000 mAh 200W",
    model: "35525",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "25 000 mAh (90 Wh) y 200 W en total: hasta 140 W por el primer USB-C y 100 W por el segundo para cargar dos laptops.",
    images: [placeholderImage(category, "Nexode Power Bank 25000 mAh 200W")],
    specs: {
      capacity: 25000,
      maxPower: 200,
      // ugreen.com: USB-C1 up to 140 W, USB-C2 up to 100 W.
      maxPortPower: 140,
      ports: "2 × USB-C (140 W y 100 W), 1 × USB-A",
      wireless: false,
      display: true,
      weight: 508,
    },
    options: [],
    variants: [
      { sku: "UGR-35525", options: {}, price: 32890, availability: IN_STOCK },
    ],
    expertReview: {
      verdict:
        "La batería para trabajar fuera de casa: carga dos laptops a la vez y queda por debajo de los 100 Wh.",
      forWhom: [
        "Trabajas con laptop en viajes, coworkings o fuera de la oficina",
        "Quieres cargar laptop y celular a la vez sin buscar enchufe",
      ],
      notFor: [
        "Buscas algo para el bolsillo: pesa alrededor de medio kilo",
        "Solo cargas tu celular: una de 10 000 mAh te basta y pesa menos de la mitad",
      ],
      rubric: [
        {
          criterion: "Potencia",
          score: 5,
          note: "140 W por un puerto y 200 W en total cubren laptops exigentes.",
        },
        {
          criterion: "Capacidad",
          score: 5,
          note: "90 Wh: de las más grandes que suelen aceptarse en cabina (revisa la regla de tu aerolínea).",
        },
        {
          criterion: "Portabilidad",
          score: 2,
          note: "Unos 508 g: va en la mochila, no en el bolsillo.",
        },
        {
          criterion: "Información en pantalla",
          score: 4,
          note: "La pantalla muestra la carga restante y la potencia de salida.",
        },
      ],
    },
    tags: ["laptop", "usb-c", "pd 3.1", "viaje", "90 wh"],
  },
];
