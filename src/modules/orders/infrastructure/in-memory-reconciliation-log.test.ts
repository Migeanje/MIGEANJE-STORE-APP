// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PendingReconciliation } from "@/modules/orders/application/ports";
import { anOrder } from "@/modules/orders/testing/order-builders";
import { createInMemoryReconciliationLog } from "./in-memory-reconciliation-log";

function anEntry(): PendingReconciliation {
  const { payment: _payment, ...order } = anOrder();
  return {
    order,
    chargeId: "chr_demo_1",
    amount: order.totals.total,
    currency: "PEN",
    cartId: "4b3c2d1e-0f9a-4b8c-9d7e-6f5a4b3c2d1e",
    failure: "disk full",
    recordedAt: "2026-10-02T15:00:00.000Z",
  };
}

describe("createInMemoryReconciliationLog", () => {
  it("keeps every pending reconciliation, oldest first", async () => {
    const log = createInMemoryReconciliationLog();
    const first = anEntry();
    const second = { ...anEntry(), chargeId: "chr_demo_2" };

    await log.record(first);
    await log.record(second);

    expect(await log.list()).toEqual([first, second]);
  });

  it("stores and returns copies", async () => {
    const log = createInMemoryReconciliationLog();
    const entry = anEntry();
    await log.record(entry);

    entry.order.customer.firstName = "Changed";
    const [read] = await log.list();
    expect(read?.order.customer.firstName).toBe("Ana");
  });
});
