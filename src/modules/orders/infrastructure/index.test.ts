// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { anOrder } from "@/modules/orders/testing/order-builders";
import { getOrderRepository, getPaymentGateway } from "./index";

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

  it("throws a clear error for DATA_SOURCE=medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(() => getOrderRepository()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
    expect(() => getPaymentGateway()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
  });
});
