import type { ProductCardProps } from "@/shared/ui/molecules/product-card";
import placeholder from "../../../molecules/product-card/__fixtures__/placeholder.svg";

// Sample cards for organism and template tests and stories. Brands are plain
// descriptive text; images are the neutral placeholder.
function card(
  slug: string,
  overrides: Partial<ProductCardProps> & Pick<ProductCardProps, "name">,
): ProductCardProps {
  return {
    href: `/productos/${slug}`,
    image: {
      src: placeholder,
      alt: `Imagen referencial de ${overrides.name}`,
      width: 480,
      height: 480,
    },
    brand: "Anker",
    specs: [],
    price: { amount: 9990 },
    availability: { status: "in_stock", label: "En stock" },
    ...overrides,
  };
}

export const SAMPLE_PRODUCTS: readonly ProductCardProps[] = [
  card("prime-charger-100w", {
    name: "Prime Charger 100W, 3 puertos",
    specs: ["100 W", "USB-C", "170 g"],
    price: { amount: 18990 },
  }),
  card("maggo-power-bank-10k", {
    name: "MagGo Power Bank 10K Slim",
    specs: ["10,000 mAh", "30 W"],
    price: { amount: 19990 },
  }),
  card("cable-usb-c-240w", {
    name: "Prime Cable USB-C 240W trenzado",
    specs: ["240 W", "USB-IF"],
    price: { amount: 6990, compareAt: 7990 },
  }),
  card("revodok-pro-210", {
    brand: "UGREEN",
    name: "Revodok Pro 210, 10 en 1",
    specs: ["10", "USB-C 10 Gbps"],
    price: { amount: 19890 },
    availability: {
      status: "backorder",
      label: "En importación · llega en 15–20 días",
    },
  }),
  card("liberty-5", {
    brand: "Soundcore",
    name: "Liberty 5",
    specs: ["In-ear", "LDAC"],
    price: { amount: 18990 },
  }),
  card("macbook-air-13", {
    brand: "Apple",
    name: "MacBook Air 13 M5",
    specs: ["M5", "13.6 pulgadas"],
    price: { amount: 529900 },
    availability: { status: "unavailable", label: "Agotado" },
  }),
];
