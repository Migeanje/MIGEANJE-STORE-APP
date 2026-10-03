import type { CartRepository } from "@/modules/cart/application/ports";
import { type Cart, cartSchema, emptyCart } from "@/modules/cart/domain/cart";

export type InMemoryCartRepositoryOptions = {
  /** Where carts live; share one Map to share carts between repositories. */
  store?: Map<string, Cart>;
  /** New cart ids; random UUIDs by default. */
  createId?: () => string;
};

/**
 * CartRepository over a Map, for `DATA_SOURCE=mock` and tests. Carts are
 * validated with `cartSchema` before they are stored (a bug fails loudly) and
 * deep-copied on every read and write, so no caller shares mutable state with
 * the store or with another request.
 */
export function createInMemoryCartRepository({
  store = new Map(),
  createId = () => crypto.randomUUID(),
}: InMemoryCartRepositoryOptions = {}): CartRepository {
  return {
    async get(id) {
      const cart = store.get(id);
      return cart ? structuredClone(cart) : null;
    },
    async create() {
      const cart = emptyCart(createId());
      store.set(cart.id, structuredClone(cart));
      return cart;
    },
    async save(cart) {
      const valid = cartSchema.parse(cart);
      store.set(valid.id, structuredClone(valid));
    },
  };
}
