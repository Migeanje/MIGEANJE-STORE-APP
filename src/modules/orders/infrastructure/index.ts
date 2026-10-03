// Composition root of the orders module. `server-only` turns an import from a
// Client Component into a build error: orders hold personal data and the
// payment gateway will hold Culqi's secret key (F4).
import "server-only";
import type {
  OrderRepository,
  PaymentGateway,
} from "@/modules/orders/application/ports";
import type { OrderStatus } from "@/modules/orders/domain/order";
import {
  type AttemptLimiter,
  createAttemptLimiter,
} from "@/shared/lib/attempt-limiter";
import { readDataSource } from "@/shared/lib/data-source";
import {
  DEMO_ORDER_EMAIL,
  DEMO_TRACKING_ORDERS,
  demoOrders,
} from "./fixtures/demo-orders";
import { createInMemoryOrderRepository } from "./in-memory-order-repository";
import {
  createInMemoryReconciliationLog,
  type InMemoryReconciliationLog,
} from "./in-memory-reconciliation-log";
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

/**
 * Orders of the data source selected by `DATA_SOURCE`. The mock store starts
 * with the demo orders (dated relative to its creation); the repository
 * itself and `findOrder` know nothing about them.
 */
export function getOrderRepository(): OrderRepository {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockOrdersGlobal;
      global[MOCK_ORDERS] ??= createInMemoryOrderRepository({
        store: new Map(
          demoOrders(new Date()).map((order) => [order.number, order]),
        ),
      });
      return global[MOCK_ORDERS];
    }
    case "medusa":
      return medusaNotReady("order");
  }
}

export type DemoTracking = {
  email: string;
  orders: readonly { number: string; status: OrderStatus }[];
};

/** The demo orders to hint on the tracking page; null unless DATA_SOURCE=mock. */
export function getDemoTracking(): DemoTracking | null {
  return readDataSource() === "mock"
    ? { email: DEMO_ORDER_EMAIL, orders: DEMO_TRACKING_ORDERS }
    : null;
}

// Failed order lookups allowed per client key and window.
const LOOKUP_MAX_FAILURES = 10;
const LOOKUP_WINDOW_MS = 15 * 60 * 1000;

const LOOKUP_ATTEMPTS = Symbol.for(
  "migeanje-store.orders.order-lookup-attempts",
);
type LookupAttemptsGlobal = typeof globalThis & {
  [LOOKUP_ATTEMPTS]?: AttemptLimiter;
};

/**
 * Failed order lookups by number and email per client key (10 per 15
 * minutes), shared by the public tracking and the confirmation unlock, for
 * every data source. Keys come from `identifyClient` (`shared/lib/client-key.ts`). In
 * this process's memory: a best-effort guard; real rate limiting belongs to
 * the edge or the backend.
 */
export function getOrderLookupAttempts(): AttemptLimiter {
  const global = globalThis as LookupAttemptsGlobal;
  global[LOOKUP_ATTEMPTS] ??= createAttemptLimiter({
    maxFailures: LOOKUP_MAX_FAILURES,
    windowMs: LOOKUP_WINDOW_MS,
  });
  return global[LOOKUP_ATTEMPTS];
}

// DEV ONLY, like the mock orders: approved charges whose order could not be
// stored, in this process's memory (lost on restart).
const MOCK_RECONCILIATIONS = Symbol.for(
  "migeanje-store.orders.mock-reconciliation-log",
);
type MockReconciliationsGlobal = typeof globalThis & {
  [MOCK_RECONCILIATIONS]?: InMemoryReconciliationLog;
};

/**
 * Approved charges whose order could not be stored, to reconcile by hand.
 * Real idempotency (Culqi idempotency key / order intent) arrives in F4.
 */
export function getReconciliationLog(): InMemoryReconciliationLog {
  switch (readDataSource()) {
    case "mock": {
      const global = globalThis as MockReconciliationsGlobal;
      global[MOCK_RECONCILIATIONS] ??= createInMemoryReconciliationLog();
      return global[MOCK_RECONCILIATIONS];
    }
    case "medusa":
      return medusaNotReady("reconciliation");
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
