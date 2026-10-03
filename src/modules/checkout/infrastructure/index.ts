// Composition root of the checkout module. `server-only` turns an import from
// a Client Component into a build error: drafts hold personal data.
import "server-only";
import type {
  CheckoutDraftRepository,
  UbigeoDirectory,
} from "@/modules/checkout/application/ports";
import { readDataSource } from "@/shared/lib/data-source";
import { createInMemoryCheckoutDraftRepository } from "./in-memory-checkout-draft-repository";
import { createMockUbigeoDirectory } from "./ubigeo.mock";

// DEV ONLY: with DATA_SOURCE=mock, drafts live in this process's memory (on
// globalThis, so dev hot reloads keep them). Lost on restart, not shared
// between server instances.
const MOCK_DRAFTS = Symbol.for("migeanje-store.checkout.mock-drafts");
type MockDraftsGlobal = typeof globalThis & {
  [MOCK_DRAFTS]?: CheckoutDraftRepository;
};

function medusaNotReady(what: string): never {
  throw new Error(
    `DATA_SOURCE=medusa is not implemented yet: the Medusa ${what} adapter arrives in F3. Use DATA_SOURCE=mock.`,
  );
}

/** Checkout drafts of the data source selected by `DATA_SOURCE`. */
export function getCheckoutDraftRepository(): CheckoutDraftRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockDraftsGlobal;
      global[MOCK_DRAFTS] ??= createInMemoryCheckoutDraftRepository();
      return global[MOCK_DRAFTS];
    }
    case "medusa":
      return medusaNotReady("checkout draft");
  }
}

/** Departamentos, provincias and distritos of the selected data source. */
export function getUbigeoDirectory(): UbigeoDirectory {
  switch (readDataSource()) {
    case "mock":
      return createMockUbigeoDirectory();
    case "medusa":
      return medusaNotReady("ubigeo");
  }
}
