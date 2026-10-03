// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getReconciliationLog } from "@/modules/orders/infrastructure";
import { anOrder } from "@/modules/orders/testing/order-builders";
import { findPendingPayment } from "./pending-payment";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("findPendingPayment", () => {
  it("tells the payment step that a cart already has a charge to reconcile", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const cartId = crypto.randomUUID();
    expect(await findPendingPayment(cartId)).toBeNull();

    const { payment: _payment, ...order } = anOrder({
      number: "MG-2026-777001",
    });
    await getReconciliationLog().record({
      order,
      chargeId: "chr_demo_9",
      amount: order.totals.total,
      currency: "PEN",
      cartId,
      failure: "disk full",
      recordedAt: "2026-10-02T15:00:00.000Z",
    });

    // Only the reference: never the order's personal data.
    expect(await findPendingPayment(cartId)).toEqual({
      reference: "MG-2026-777001",
    });
    expect(await findPendingPayment(crypto.randomUUID())).toBeNull();
  });
});
