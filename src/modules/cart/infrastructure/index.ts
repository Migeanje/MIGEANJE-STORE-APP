// Composition root of the cart module. `server-only` turns an import from a
// Client Component into a build error: carts and their ids stay on the server.
import "server-only";
import type {
  CartRepository,
  CartServices,
  ProductLookup,
} from "@/modules/cart/application/ports";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { readDataSource } from "@/shared/lib/data-source";
import { createCatalogProductLookup } from "./catalog-product-lookup";
import { createInMemoryCartRepository } from "./in-memory-cart-repository";

// DEV ONLY: with DATA_SOURCE=mock, carts live in this process's memory. They
// are lost on restart and not shared between server instances. The store hangs
// on globalThis so dev hot reloads (which re-evaluate modules) keep it.
const MOCK_CARTS = Symbol.for("migeanje-store.cart.mock-repository");
type MockCartsGlobal = typeof globalThis & {
  [MOCK_CARTS]?: CartRepository;
};

/**
 * The cart adapter selected by `DATA_SOURCE` (`mock` when unset or empty).
 * Server Components and server actions call this; nothing else imports an
 * adapter. Throws for `medusa` (F3) and for unknown values.
 */
export function getCartRepository(): CartRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockCartsGlobal;
      global[MOCK_CARTS] ??= createInMemoryCartRepository();
      return global[MOCK_CARTS];
    }
    case "medusa":
      throw new Error(
        "DATA_SOURCE=medusa is not implemented yet: the Medusa cart adapter arrives in F3. Use DATA_SOURCE=mock.",
      );
  }
}

/** Prices and availability from the catalog of the same data source. */
export function getProductLookup(): ProductLookup {
  return createCatalogProductLookup(getCatalogRepository());
}

/** Both ports, for the use cases that need the catalog. */
export function getCartServices(): CartServices {
  return { carts: getCartRepository(), products: getProductLookup() };
}
