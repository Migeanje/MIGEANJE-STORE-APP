import placeholder from "@/shared/ui/molecules/product-card/__fixtures__/placeholder.svg";
import type {
  ComparisonProduct,
  ComparisonTableRow,
} from "../comparison-table";

function product(
  key: string,
  overrides: Partial<ComparisonProduct> & Pick<ComparisonProduct, "name">,
): ComparisonProduct {
  return {
    key,
    href: `/productos/${key}`,
    brand: "Anker",
    image: {
      src: placeholder,
      alt: `Imagen referencial de ${overrides.name}`,
      width: 480,
      height: 480,
    },
    price: { amount: 18990 },
    availability: { status: "in_stock", label: "En stock" },
    removeHref: "/comparar?productos=otro",
    ...overrides,
  };
}

export const SAMPLE_COMPARED: readonly ComparisonProduct[] = [
  product("prime-100w", { name: "Prime Charger 100W, 3 puertos" }),
  product("prime-160w", {
    name: "Prime Charger 160W, 3 puertos, Smart Display",
    price: { amount: 34990 },
    availability: {
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    },
  }),
  product("nexode-65w", {
    name: "Nexode Cargador 65W",
    brand: "UGREEN",
    price: { amount: 12990, compareAt: 15990 },
  }),
];

export const SAMPLE_ROWS: readonly ComparisonTableRow[] = [
  {
    key: "maxPower",
    label: "Potencia máxima",
    values: ["100 W", "160 W", "65 W"],
    differs: true,
  },
  {
    key: "usbCPorts",
    label: "Puertos USB-C",
    values: ["2", "3", "2"],
    differs: true,
  },
  {
    key: "protocols",
    label: "Protocolos de carga",
    values: [null, "USB PD 3.1", null],
    differs: true,
  },
  {
    key: "technology",
    label: "Tecnología",
    values: ["GaN", "GaN", "GaN"],
    differs: false,
  },
];
