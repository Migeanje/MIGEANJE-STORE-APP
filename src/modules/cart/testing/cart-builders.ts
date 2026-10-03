// Test-only builders for the cart module. Never import from production code.
import type {
  CartRepository,
  ProductLookup,
} from "@/modules/cart/application/ports";
import type {
  Cart,
  CartLine,
  CartOffer,
  LineAvailability,
} from "@/modules/cart/domain/cart";

export const CART_ID = "3f2c1d4e-5b6a-4c7d-8e9f-0a1b2c3d4e5f";
export const NEW_CART_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

export const IN_STOCK: LineAvailability = { status: "in_stock" };
export const BACKORDER: LineAvailability = {
  status: "backorder",
  leadTimeDays: { min: 15, max: 20 },
};

/** An offer for a charger in stock at S/ 189.90; override what the test needs. */
export function anOffer(overrides: Partial<CartOffer> = {}): CartOffer {
  return {
    sku: "ANK-A2688",
    unitPrice: 18990,
    availability: IN_STOCK,
    product: {
      name: "Prime Charger 100W, 3 puertos",
      brand: "Anker",
      variantLabel: "",
      href: "/productos/anker-prime-charger-100w-3-puertos",
      image: { src: "/mock/products/cargadores.svg", width: 640, height: 640 },
    },
    ...overrides,
  };
}

/** A backorder offer (15–20 days) for a second product. */
export function aBackorderOffer(overrides: Partial<CartOffer> = {}): CartOffer {
  return anOffer({
    sku: "ANK-A121D-WHT",
    unitPrice: 24890,
    availability: BACKORDER,
    product: {
      name: "Nano Charger 45W Smart Display",
      brand: "Anker",
      variantLabel: "Blanco",
      href: "/productos/anker-nano-charger-45w-smart-display?variante=ank-a121d-wht",
      image: { src: "/mock/products/cargadores.svg", width: 640, height: 640 },
    },
    ...overrides,
  });
}

/** A cart line built from an offer (in stock by default). */
export function aLine(
  overrides: Partial<CartLine> = {},
  offer: CartOffer = anOffer(),
): CartLine {
  if (offer.availability.status === "unavailable") {
    throw new Error("A cart line cannot be unavailable");
  }
  return {
    sku: offer.sku,
    quantity: 1,
    maxQuantity: offer.availability.status === "in_stock" ? 5 : 2,
    unitPrice: offer.unitPrice,
    availability: offer.availability,
    product: offer.product,
    ...overrides,
  };
}

export function aCart(lines: CartLine[] = [], id: string = CART_ID): Cart {
  return { id, lines };
}

/** A Map-backed CartRepository whose new carts get NEW_CART_ID. */
export function fakeCarts(initial: Cart[] = []) {
  const store = new Map(initial.map((cart) => [cart.id, cart]));
  const repository: CartRepository = {
    async get(id) {
      return store.get(id) ?? null;
    },
    async create() {
      const cart = aCart([], NEW_CART_ID);
      store.set(cart.id, cart);
      return cart;
    },
    async save(cart) {
      store.set(cart.id, cart);
    },
  };
  return { repository, store };
}

/** A ProductLookup that knows exactly these offers. */
export function fakeProducts(offers: CartOffer[]): ProductLookup {
  return {
    async findOffer(sku) {
      return offers.find((offer) => offer.sku === sku) ?? null;
    },
  };
}
