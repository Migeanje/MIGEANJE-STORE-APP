import { randomInt } from "node:crypto";
import type { OrderRepository } from "@/modules/orders/application/ports";
import {
  formatOrderNumber,
  type Order,
  orderSchema,
  orderYear,
} from "@/modules/orders/domain/order";

export type InMemoryOrderRepositoryOptions = {
  store?: Map<string, Order>;
  /** The 6-digit part of new numbers; random (not sequential) by default. */
  randomSequence?: () => number;
};

// Random numbers keep the sales volume private and make guessing harder
// (the public lookup also needs the buyer's email).
const MAX_ATTEMPTS = 100;

/**
 * OrderRepository over a Map, for `DATA_SOURCE=mock` and tests. Orders are
 * validated before they are stored and deep-copied on every read and write;
 * a number is never reused by another order.
 */
export function createInMemoryOrderRepository({
  store = new Map(),
  randomSequence = () => randomInt(0, 1_000_000),
}: InMemoryOrderRepositoryOptions = {}): OrderRepository {
  return {
    async nextNumber(placedAt) {
      const year = orderYear(placedAt);
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const number = formatOrderNumber(year, randomSequence());
        if (!store.has(number)) return number;
      }
      throw new Error(`No free order number for ${year}`);
    },
    async save(order) {
      const valid = orderSchema.parse(order);
      const existing = store.get(valid.number);
      if (existing && existing.accessToken !== valid.accessToken) {
        throw new Error(
          `Order number ${valid.number} belongs to another order`,
        );
      }
      store.set(valid.number, structuredClone(valid));
    },
    async findByNumber(number) {
      const order = store.get(number);
      return order ? structuredClone(order) : null;
    },
  };
}
