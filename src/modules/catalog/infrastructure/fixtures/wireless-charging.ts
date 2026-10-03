import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { COLOR, colorVariants, IN_STOCK, placeholderImage } from "./helpers";

const category = CATEGORIES.wirelessCharging;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const wirelessCharging: Product[] = [
  {
    slug: "anker-maggo-estacion-de-carga-3-en-1-plegable",
    name: "MagGo Estación de carga 3 en 1 plegable",
    model: "A25M8",
    brand: BRANDS.anker,
    category: categoryRef(category),
    summary:
      "Carga tu iPhone (Qi2, 15 W), tu Apple Watch y tus AirPods a la vez. Se pliega en un cubo de 6 cm e incluye adaptador de 40 W.",
    images: [
      placeholderImage(category, "MagGo Estación de carga 3 en 1 plegable"),
    ],
    specs: {
      devices: 3,
      standard: "Qi2",
      maxPhonePower: 15,
      watchCharger: true,
      adapterIncluded: true,
      foldable: true,
      dimensions: "60 × 60 × 36 mm (plegada)",
    },
    options: [COLOR],
    variants: colorVariants(
      "ANK-A25M8",
      [
        ["Negro", "BLK"],
        ["Blanco", "WHT"],
        ["Rosado", "PNK"],
        ["Verde azulado", "TEA"],
      ],
      { price: 39990, availability: IN_STOCK },
    ),
    expertReview: {
      verdict:
        "La forma más ordenada de cargar iPhone, Apple Watch y AirPods de viaje: todo en un cubo y con el adaptador en la caja.",
      forWhom: [
        "Usas iPhone, Apple Watch y AirPods y viajas seguido",
        "Quieres una sola estación en tu velador, sin cables sueltos",
      ],
      notFor: [
        "Tienes un iPhone 16 o 17 y quieres la carga inalámbrica más rápida: aquí el iPhone carga a 15 W, no a 25 W",
        "No usas Apple Watch: una base 2 en 1 te sale más a cuenta",
      ],
      rubric: [
        {
          criterion: "Portabilidad",
          score: 5,
          note: "Plegada mide 6 × 6 cm: entra en cualquier bolsillo de la mochila.",
        },
        {
          criterion: "Velocidad de carga",
          score: 3,
          note: "Qi2 a 15 W para el iPhone; correcta, pero ya hay bases de 25 W.",
        },
        {
          criterion: "Todo incluido",
          score: 5,
          note: "Trae el adaptador de 40 W: no tienes que comprar nada más.",
        },
        {
          criterion: "Compatibilidad",
          score: 4,
          note: "Pensada para el ecosistema Apple; con otros celulares Qi solo aprovechas parte.",
        },
      ],
    },
    tags: ["magsafe", "qi2", "apple watch", "airpods", "viaje", "plegable"],
  },
  {
    slug: "ugreen-magflow-qi2-25w-2-en-1-plegable",
    name: "MagFlow Qi2 25W 2 en 1 plegable",
    model: "55960",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "Base plegable Qi2.2 que carga tu iPhone hasta a 25 W y tus audífonos a 5 W, con un USB-C extra para el cable de tu Apple Watch.",
    images: [placeholderImage(category, "MagFlow Qi2 25W 2 en 1 plegable")],
    specs: {
      devices: 2,
      standard: "Qi2.2",
      // ugreen.com (en-ca, model 55960): up to 25 W on iPhone 16/17, 15 W on
      // iPhone 12-15; earbuds pad 5 W; extra USB-C port 5 W.
      maxPhonePower: 25,
      watchCharger: false,
      adapterIncluded: false,
      foldable: true,
      // Weight left out: UGREEN lists 11.9 oz (packaged?) while retailers list
      // about 110 g.
    },
    options: [],
    variants: [
      { sku: "UGR-55960", options: {}, price: 18890, availability: IN_STOCK },
    ],
    expertReview: {
      verdict:
        "Carga inalámbrica de 25 W a buen precio, siempre que tengas un iPhone reciente y un adaptador de 45 W.",
      forWhom: [
        "Tienes un iPhone 16 o 17 y quieres la carga inalámbrica más rápida",
        "Ya tienes un buen cargador USB-C de 45 W o más",
      ],
      notFor: [
        "Tu iPhone es del 12 al 15: carga a 15 W, igual que una base Qi2 normal",
        "No tienes adaptador: no viene en la caja y con uno pequeño no llega a 25 W",
      ],
      rubric: [
        {
          criterion: "Velocidad de carga",
          score: 5,
          note: "Hasta 25 W con Qi2.2 en iPhone 16 y 17.",
        },
        {
          criterion: "Todo incluido",
          score: 2,
          note: "Sin adaptador; necesitas uno de 45 W o más para la carga máxima.",
        },
        {
          criterion: "Versatilidad",
          score: 4,
          note: "Base para audífonos y un USB-C extra para el cable de tu Apple Watch.",
        },
        {
          criterion: "Relación precio-calidad",
          score: 4,
          note: "Buen precio para una base de 25 W si ya tienes el adaptador.",
        },
      ],
    },
    tags: ["magsafe", "qi2", "qi2.2", "25 w", "airpods", "plegable"],
  },
];
