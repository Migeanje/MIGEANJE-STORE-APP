// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { findOrder } from "@/modules/orders/application/find-order";
import { currentStatus } from "@/modules/orders/domain/order";
import { anOrder } from "@/modules/orders/testing/order-builders";
import {
  getDemoTracking,
  getOrderLookupAttempts,
  getOrderRepository,
  getPaymentGateway,
  getReconciliationLog,
} from "./index";

vi.mock("server-only", () => ({}));

describe("orders composition root", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses one process-wide in-memory order store for DATA_SOURCE=mock (or unset)", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const orders = getOrderRepository();
    const order = anOrder({ number: "MG-2026-777777" });
    await orders.save(order);

    vi.stubEnv("DATA_SOURCE", undefined);
    expect(getOrderRepository()).toBe(orders);
    expect(await getOrderRepository().findByNumber(order.number)).toEqual(
      order,
    );
  });

  it("uses the demo payment gateway for DATA_SOURCE=mock", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(getPaymentGateway()).toEqual(
      expect.objectContaining({ charge: expect.any(Function) }),
    );
  });

  it("seeds the demo orders for DATA_SOURCE=mock and hints them", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const order = await findOrder(
      getOrderRepository(),
      "MG-2026-480315",
      "demo@migeanje.pe",
    );
    expect(order && currentStatus(order)).toBe("en_importacion");

    expect(getDemoTracking()).toEqual({
      email: "demo@migeanje.pe",
      orders: [
        { number: "MG-2026-480315", status: "en_importacion" },
        { number: "MG-2026-275904", status: "en_camino" },
        { number: "MG-2026-913628", status: "entregado" },
      ],
    });
    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(getDemoTracking()).toBeNull();
  });

  it("keeps one process-wide log of charges to reconcile for DATA_SOURCE=mock", () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const log = getReconciliationLog();
    expect(getReconciliationLog()).toBe(log);
  });

  it("keeps one process-wide limiter of failed order lookups (tracking and confirmation)", () => {
    const attempts = getOrderLookupAttempts();
    expect(getOrderLookupAttempts()).toBe(attempts);

    for (let failure = 0; failure < 9; failure += 1) {
      attempts.recordFailure("192.0.2.10");
    }
    expect(attempts.isBlocked("192.0.2.10")).toBe(false);
    attempts.recordFailure("192.0.2.10");
    expect(attempts.isBlocked("192.0.2.10")).toBe(true);
  });

  it("throws a clear error for DATA_SOURCE=medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(() => getOrderRepository()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
    expect(() => getPaymentGateway()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
    expect(() => getReconciliationLog()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
  });
});
