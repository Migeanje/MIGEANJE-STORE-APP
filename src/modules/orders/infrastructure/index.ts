// Composition root of the orders module. `server-only` turns an import from a
// Client Component into a build error: orders hold personal data and the
// payment gateway will hold Culqi's secret key (F4).
import "server-only";
import type {
  OrderRepository,
  PaymentGateway,
} from "@/modules/orders/application/ports";
import { readDataSource } from "@/shared/lib/data-source";
import { createInMemoryOrderRepository } from "./in-memory-order-repository";
import { createMockPaymentGateway } from "./mock-payment-gateway";

// DEV ONLY: with DATA_SOURCE=mock, orders live in this process's memory (on
// globalThis, so dev hot reloads keep them). Lost on restart, not shared
// between server instances.
const MOCK_ORDERS = Symbol.for("migeanje-store.orders.mock-repository");
type MockOrdersGlobal = typeof globalThis & {
  [MOCK_ORDERS]?: OrderRepository;
};

function medusaNotReady(what: string): never {
  throw new Error(
    `DATA_SOURCE=medusa is not implemented yet: the Medusa ${what} adapter arrives in F3. Use DATA_SOURCE=mock.`,
  );
}

/** Orders of the data source selected by `DATA_SOURCE`. */
export function getOrderRepository(): OrderRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockOrdersGlobal;
      global[MOCK_ORDERS] ??= createInMemoryOrderRepository();
      return global[MOCK_ORDERS];
    }
    case "medusa":
      return medusaNotReady("order");
  }
}

/** The simulated payment for mock data (Culqi in F4). */
export function getPaymentGateway(): PaymentGateway {
  switch (readDataSource()) {
    case "mock":
      return createMockPaymentGateway();
    case "medusa":
      return medusaNotReady("payment");
  }
}
