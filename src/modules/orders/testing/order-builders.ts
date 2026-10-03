// Test-only builders for the orders module. Never import from production code.
import { aLine } from "@/modules/cart/testing/cart-builders";
import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import { aContact, BOLETA } from "@/modules/checkout/testing/checkout-builders";
import type {
  ChargeRequest,
  ChargeResult,
  OrderRepository,
  PaymentGateway,
  PendingReconciliation,
  ReconciliationLog,
} from "@/modules/orders/application/ports";
import { createOrder, type Order } from "@/modules/orders/domain/order";

export const ACCESS_TOKEN = "0b9f4f7e-3c1a-4d2b-9e8f-7a6b5c4d3e2f";
export const PLACED_AT = new Date("2026-10-02T15:00:00Z");

/** The approving test card (4111 1111 1111 1111). */
export function aCard(overrides: Partial<PaymentCard> = {}): PaymentCard {
  return {
    number: "4111111111111111",
    expiry: { month: 12, year: 2030 },
    cvv: "123",
    holderName: "ANA PEREZ",
    ...overrides,
  };
}

/** A paid order for two in-stock chargers shipped to Miraflores. */
export function anOrder(
  overrides: Partial<Parameters<typeof createOrder>[0]> = {},
): Order {
  return createOrder({
    number: "MG-2026-000123",
    accessToken: ACCESS_TOKEN,
    placedAt: PLACED_AT,
    contact: aContact(),
    receipt: BOLETA,
    lines: [aLine({ quantity: 2 })],
    payment: { provider: "demo", chargeId: "chr_demo_1" },
    ...overrides,
  });
}

/** A Map-backed OrderRepository that numbers orders MG-2026-000001, 2, 3… */
export function fakeOrders(initial: Order[] = []) {
  const store = new Map(initial.map((order) => [order.number, order]));
  let sequence = 0;
  const repository: OrderRepository = {
    async reserveNumber() {
      sequence += 1;
      return `MG-2026-${String(sequence).padStart(6, "0")}`;
    },
    async save(order) {
      store.set(order.number, order);
    },
    async findByNumber(number) {
      return store.get(number) ?? null;
    },
  };
  return { repository, store };
}

/** A PaymentGateway answering `result` and recording every request. */
export function fakePayments(
  result: ChargeResult = { status: "approved", chargeId: "chr_demo_1" },
) {
  const requests: ChargeRequest[] = [];
  const gateway: PaymentGateway = {
    async charge(request) {
      requests.push(request);
      return result;
    },
  };
  return { gateway, requests };
}

/** A ReconciliationLog keeping every entry, or failing with `failure`. */
export function fakeReconciliations({ failure }: { failure?: Error } = {}) {
  const entries: PendingReconciliation[] = [];
  const log: ReconciliationLog = {
    async record(entry) {
      if (failure) throw failure;
      entries.push(entry);
    },
    async findByCart(cartId) {
      return entries.findLast((entry) => entry.cartId === cartId) ?? null;
    },
  };
  return { log, entries };
}
