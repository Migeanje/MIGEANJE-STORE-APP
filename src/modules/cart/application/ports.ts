import type { Cart, CartOffer } from "@/modules/cart/domain/cart";

/**
 * Port: where carts are kept. Adapters live in `infrastructure/` (in-memory
 * for `DATA_SOURCE=mock`, Medusa carts in F3). Use cases and UI only see this
 * interface, so switching `DATA_SOURCE` never touches them.
 */
export interface CartRepository {
  /** The cart with this id, or null when it does not exist (expired, unknown). */
  get(id: string): Promise<Cart | null>;
  /** A new, empty, stored cart with a fresh id. */
  create(): Promise<Cart>;
  /** Stores the cart, replacing the one with the same id. */
  save(cart: Cart): Promise<void>;
}

/**
 * Port: what the catalog says about a SKU right now (price in céntimos,
 * availability, display data). The cart never imports catalog internals; an
 * adapter in `infrastructure/` answers through the catalog's composition root.
 */
export interface ProductLookup {
  /** The current offer for the SKU, or null when the catalog has no such SKU. */
  findOffer(sku: string): Promise<CartOffer | null>;
}

/** Both ports, for the use cases that need the catalog. */
export type CartServices = {
  carts: CartRepository;
  products: ProductLookup;
};
