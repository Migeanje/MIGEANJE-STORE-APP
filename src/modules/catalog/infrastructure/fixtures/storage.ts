import { categoryRef } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import { BRANDS } from "./brands";
import { CATEGORIES } from "./categories";
import { IN_STOCK, placeholderImage } from "./helpers";

const category = CATEGORIES.storage;

// Specs: official pages, per the approved research (Engram
// product/catalog-candidates, 2026-10-02).
export const storage: Product[] = [
  {
    slug: "ugreen-nasync-dxp4800-plus",
    name: "NASync DXP4800 Plus",
    model: "35260",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "NAS de 4 bahías con Intel Pentium Gold, 8 GB DDR5, dos ranuras M.2 NVMe y red de 10 Gb y 2.5 Gb. Se vende sin discos.",
    images: [placeholderImage(category, "NASync DXP4800 Plus")],
    specs: {
      type: "NAS",
      drives: "4 bahías SATA y 2 ranuras M.2 NVMe",
      sataSupport: true,
      maxCapacity: 144,
      maxSpeed: 10,
      connectivity: "Ethernet 10 Gb y 2.5 Gb, USB-C 10 Gbps, HDMI 4K",
      processor: "Intel Pentium Gold 8505 (5 núcleos)",
      memory: "8 GB DDR5 (ampliable a 64 GB)",
    },
    options: [],
    variants: [
      { sku: "UGR-35260", options: {}, price: 349990, availability: IN_STOCK },
    ],
    expertReview: {
      verdict:
        "Una nube privada potente para tu casa u oficina pequeña, con red de 10 Gb y espacio para crecer. Los discos van por separado.",
      forWhom: [
        "Quieres respaldar las fotos y archivos de toda la familia sin pagar suscripciones",
        "Editas video o trabajas con archivos grandes y tienes (o planeas) una red de 10 Gb",
      ],
      notFor: [
        "Buscas algo listo para usar: tienes que comprar los discos y configurarlo",
        "Solo necesitas respaldar una laptop: un disco externo es más simple y barato",
      ],
      rubric: [
        {
          criterion: "Rendimiento",
          score: 5,
          note: "Procesador de 5 núcleos, DDR5 y caché en M.2 NVMe.",
        },
        {
          criterion: "Conectividad",
          score: 5,
          note: "10 Gb y 2.5 Gb de red, USB-C de 10 Gbps y salida HDMI.",
        },
        {
          criterion: "Facilidad de uso",
          score: 3,
          note: "La configuración inicial pide algo de tiempo y conocimientos de red.",
        },
        {
          criterion: "Capacidad de crecer",
          score: 5,
          note: "Hasta 144 TB en las bahías y RAM ampliable a 64 GB.",
        },
      ],
    },
    tags: ["nas", "respaldo", "nube privada", "10gbe", "servidor"],
  },
  {
    slug: "ugreen-carcasa-ssd-m2-nvme-10gbps",
    name: "Carcasa para SSD M.2 NVMe 10 Gbps",
    model: "70532",
    brand: BRANDS.ugreen,
    category: categoryRef(category),
    summary:
      "Carcasa de aluminio sin herramientas que convierte un SSD M.2 NVMe en un disco externo de 10 Gbps. Incluye cables USB-C y USB-A.",
    images: [placeholderImage(category, "Carcasa para SSD M.2 NVMe 10 Gbps")],
    specs: {
      type: "Carcasa para SSD",
      drives: "1 SSD M.2 NVMe (M key y B+M key, 2242 y 2280)",
      sataSupport: false,
      maxSpeed: 10,
      connectivity: "USB-C 10 Gbps (UASP y TRIM)",
      toolFree: true,
    },
    options: [],
    variants: [
      { sku: "UGR-70532", options: {}, price: 13890, availability: IN_STOCK },
    ],
    expertReview: {
      verdict:
        "La manera más barata de tener un disco externo rápido: reutiliza un SSD NVMe y llega a 10 Gbps. No sirve para SSD SATA.",
      forWhom: [
        "Cambiaste el SSD de tu laptop y quieres reutilizar el anterior",
        "Necesitas mover archivos grandes entre equipos a buena velocidad",
      ],
      notFor: [
        "Tu SSD M.2 es SATA: esta carcasa solo acepta NVMe",
        "Quieres la máxima velocidad de un SSD NVMe moderno: 10 Gbps es menos de lo que el disco puede dar",
      ],
      rubric: [
        {
          criterion: "Velocidad",
          score: 4,
          note: "10 Gbps por USB-C, con UASP y TRIM.",
        },
        {
          criterion: "Instalación",
          score: 5,
          note: "Sin herramientas: abres, colocas el SSD y cierras.",
        },
        {
          criterion: "Compatibilidad",
          score: 3,
          note: "NVMe M key y B+M key de 2242 y 2280; no acepta SATA.",
        },
        {
          criterion: "Relación precio-calidad",
          score: 5,
          note: "Barata y con cables USB-C y USB-A incluidos.",
        },
      ],
    },
    tags: ["ssd", "nvme", "m.2", "disco externo", "usb-c"],
  },
];
