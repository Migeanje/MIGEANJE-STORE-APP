import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { COLOR, colorVariants, IN_STOCK, placeholderImage } from "./helpers";

const category = CATEGORIES.audio;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02). AirPods Pro 3 is in the Apple
// group (apple.ts) but shares this category.
export const audio: Product[] = [
  {
    slug: "soundcore-liberty-5",
    name: "Liberty 5",
    model: "A3957",
    brand: BRANDS.soundcore,
    category: categoryRef(category),
    summary:
      "Audífonos in-ear con cancelación de ruido adaptativa 3.0, drivers de 9.2 mm, LDAC y Bluetooth 5.4. Resistentes al agua y al sudor (IP55).",
    images: [placeholderImage(category, "Liberty 5")],
    specs: {
      formFactor: "In-ear",
      anc: true,
      ldac: true,
      batteryAnc: 8,
      batteryWithCase: 32,
      heartRate: false,
      waterResistance: "IP55",
      bluetooth: "5.4",
      weight: "4.6 g por audífono",
    },
    options: [COLOR],
    variants: colorVariants(
      "SND-A3957",
      [
        ["Negro", "BLK"],
        ["Blanco", "WHT"],
        ["Azul marino", "NVY"],
        ["Durazno", "APR"],
      ],
      { price: 18990, availability: IN_STOCK },
    ),
    expertReview: {
      verdict:
        "Cancelación de ruido y sonido de gama alta a un precio de gama media. En Android con LDAC rinden al máximo.",
      forWhom: [
        "Usas un celular Android compatible con LDAC",
        "Quieres buena cancelación de ruido para el transporte público sin gastar de más",
      ],
      notFor: [
        "Usas iPhone y quieres aprovechar el LDAC: el iPhone no lo soporta y usa AAC",
        "Buscas integración total con el ecosistema Apple (cambio automático entre equipos)",
      ],
      rubric: [
        {
          criterion: "Cancelación de ruido",
          score: 4,
          note: "Adaptativa 3.0: se ajusta sola al ruido del entorno.",
        },
        {
          criterion: "Calidad de sonido",
          score: 4,
          note: "Drivers de 9.2 mm y LDAC para audio de alta resolución en Android.",
        },
        {
          criterion: "Batería",
          score: 4,
          note: "8 h con cancelación de ruido y 32 h en total con el estuche.",
        },
        {
          criterion: "Relación precio-calidad",
          score: 5,
          note: "Funciones de audífonos que cuestan bastante más.",
        },
      ],
    },
    tags: ["audífonos", "inalámbricos", "anc", "ldac", "android", "bluetooth"],
  },
  {
    slug: "soundcore-space-one-pro",
    name: "Space One Pro",
    model: "A3062",
    brand: BRANDS.soundcore,
    category: categoryRef(category),
    summary:
      "Audífonos over-ear plegables con cancelación de ruido adaptativa 3.0, LDAC y hasta 40 horas de batería con la cancelación activa (60 horas sin ella).",
    images: [placeholderImage(category, "Space One Pro")],
    specs: {
      formFactor: "Over-ear",
      anc: true,
      ldac: true,
      batteryAnc: 40,
      heartRate: false,
      weight: "286.2 g",
    },
    options: [COLOR],
    variants: colorVariants(
      "SND-A3062",
      [
        ["Negro", "BLK"],
        ["Blanco crema", "CRM"],
      ],
      { price: 41990, availability: IN_STOCK },
    ),
    tags: ["audífonos", "over-ear", "anc", "ldac", "plegables", "viaje"],
  },
];
