import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import {
  BACKORDER,
  COLOR,
  colorVariants,
  IN_STOCK,
  placeholderImage,
} from "./helpers";

const category = CATEGORIES.chargers;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const chargers: Product[] = [
  {
    slug: "anker-nano-charger-45w-smart-display",
    name: "Nano Charger 45W Smart Display",
    // A121D per anker.com (A2698 appears in some listings but not on the
    // official product page).
    model: "A121D",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "Cargador USB-C de 45 W del tamaño de un cubo, con pantalla que muestra la potencia y la temperatura mientras cargas.",
    images: [placeholderImage(category, "Nano Charger 45W Smart Display")],
    specs: {
      maxPower: 45,
      maxPortPower: 45,
      usbCPorts: 1,
      usbAPorts: 0,
      protocols: ["USB PD", "PPS"],
      display: true,
      dimensions: "34 × 35.5 × 40 mm",
      weight: 75,
    },
    options: [COLOR],
    // Peru reference S/ 249 (out of stock locally): backorder.
    variants: colorVariants(
      "ANK-A121D",
      [
        ["Blanco", "WHT"],
        ["Negro", "BLK"],
        ["Azul", "BLU"],
        ["Naranja", "ORG"],
      ],
      { price: 24890, availability: BACKORDER },
    ),
    tags: ["gan", "carga rápida", "usb-c", "iphone", "compacto"],
  },
  {
    slug: "anker-prime-charger-100w-3-puertos",
    name: "Prime Charger 100W, 3 puertos",
    model: "A2688",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "Tres puertos (2 USB-C y 1 USB-A) para cargar tu laptop, celular y audífonos con un solo enchufe.",
    images: [placeholderImage(category, "Prime Charger 100W, 3 puertos")],
    specs: {
      maxPower: 100,
      maxPortPower: 100,
      usbCPorts: 2,
      usbAPorts: 1,
      display: false,
      dimensions: "43.5 × 29 × 67.8 mm",
      weight: 170,
    },
    options: [],
    variants: [
      { sku: "ANK-A2688", options: {}, price: 18990, availability: IN_STOCK },
    ],
    expertReview: {
      verdict:
        "El cargador que reemplaza a todos los de tu mochila: 100 W para una laptop y puertos de sobra para el resto.",
      forWhom: [
        "Tienes una laptop USB-C de hasta 100 W y quieres un solo cargador",
        "Viajas y cargas laptop, celular y audífonos en una sola noche",
      ],
      notFor: [
        "Necesitas 100 W para tu laptop mientras cargas otros equipos: con varios puertos a la vez el máximo combinado es 89 W",
        "Solo cargas un celular: un cargador de 30 a 45 W es más pequeño y barato",
      ],
      rubric: [
        {
          criterion: "Potencia",
          score: 5,
          note: "100 W por un solo puerto alcanzan para la mayoría de laptops USB-C.",
        },
        {
          criterion: "Uso con varios equipos",
          score: 4,
          note: "Tres puertos, pero el total baja a 89 W al usar más de uno.",
        },
        {
          criterion: "Portabilidad",
          score: 4,
          note: "170 g y enchufe compacto; más grande que un cargador de celular.",
        },
        {
          criterion: "Relación precio-calidad",
          score: 5,
          note: "Por lo que cuesta, reemplaza dos o tres cargadores.",
        },
      ],
    },
    tags: ["gan", "laptop", "usb-c", "usb-a", "viaje"],
  },
  {
    slug: "anker-prime-charger-160w-3-puertos-smart-display",
    name: "Prime Charger 160W, 3 puertos, Smart Display",
    model: "A2687",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "160 W repartidos en tres puertos USB-C, con pantalla para ver la potencia de cada puerto. Pensado para laptops exigentes.",
    images: [
      placeholderImage(
        category,
        "Prime Charger 160W, 3 puertos, Smart Display",
      ),
    ],
    specs: {
      maxPower: 160,
      // anker.com lists 28 V ⎓ 5.36 A (150 W max) per port, but only with
      // Anker's own cable in specific modes; 140 W is the standard USB PD 3.1
      // figure. Conservative value.
      maxPortPower: 140,
      usbCPorts: 3,
      usbAPorts: 0,
      protocols: ["USB PD 3.1"],
      display: true,
      dimensions: "65 × 52 × 35 mm",
      weight: 220,
    },
    options: [],
    variants: [
      {
        sku: "ANK-A2687",
        options: {},
        // price: estimated (no Peru reference found)
        price: 34990,
        availability: BACKORDER,
      },
    ],
    tags: ["gan", "laptop", "usb-c", "macbook pro", "pd 3.1"],
  },
];
