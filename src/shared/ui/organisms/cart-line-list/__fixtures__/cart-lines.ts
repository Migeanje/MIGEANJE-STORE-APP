// Shared fixtures for the cart organisms' tests and stories.
import type { CartLineListItem } from "../cart-line-list";

const IMAGE = {
  src: "/mock/products/cargadores.svg",
  width: 640,
  height: 640,
};

export const IN_STOCK_LINE: CartLineListItem = {
  sku: "ANK-A2688",
  href: "/productos/anker-prime-charger-100w-3-puertos?variante=ank-a2688",
  name: "Prime Charger 100W, 3 puertos",
  displayName: "Prime Charger 100W, 3 puertos",
  brand: "Anker",
  image: IMAGE,
  availability: { status: "in_stock", label: "En stock" },
  unitPrice: 18990,
  lineTotal: 37980,
  quantity: 2,
  maxQuantity: 5,
};

export const BACKORDER_LINE: CartLineListItem = {
  sku: "ANK-A121D-WHT",
  href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
  name: "Nano Charger 45W Smart Display",
  displayName: "Nano Charger 45W Smart Display (Blanco)",
  brand: "Anker",
  variantLabel: "Blanco",
  image: IMAGE,
  availability: {
    status: "backorder",
    label: "En importación · llega en 15–20 días",
  },
  unitPrice: 24890,
  lineTotal: 24890,
  quantity: 1,
  maxQuantity: 2,
};
