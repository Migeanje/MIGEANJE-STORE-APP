// @vitest-environment node
import { describe, expect, it } from "vitest";
import { anOrder } from "@/modules/orders/testing/order-builders";
import { createInMemoryOrderRepository } from "./in-memory-order-repository";

describe("createInMemoryOrderRepository", () => {
  it("numbers orders MG-<Lima year>-<6 random digits>", async () => {
    const orders = () =>
      createInMemoryOrderRepository({ randomSequence: () => 4521 });
    expect(await orders().reserveNumber(new Date("2026-10-03T12:00:00Z"))).toBe(
      "MG-2026-004521",
    );
    // 2027-01-01 03:00 UTC is still 2026 in Lima.
    expect(await orders().reserveNumber(new Date("2027-01-01T03:00:00Z"))).toBe(
      "MG-2026-004521",
    );
  });

  it("skips numbers already used", async () => {
    const sequences = [123, 123, 456];
    const orders = createInMemoryOrderRepository({
      randomSequence: () => sequences.shift() ?? 0,
    });
    await orders.save(anOrder({ number: "MG-2026-000123" }));
    expect(await orders.reserveNumber(new Date("2026-10-03T12:00:00Z"))).toBe(
      "MG-2026-000456",
    );
  });

  it("never reserves the same number twice, even before its order is saved", async () => {
    const sequences = [123, 123, 456];
    const orders = createInMemoryOrderRepository({
      randomSequence: () => sequences.shift() ?? 0,
    });
    const at = new Date("2026-10-03T12:00:00Z");

    expect(await orders.reserveNumber(at)).toBe("MG-2026-000123");
    expect(await orders.reserveNumber(at)).toBe("MG-2026-000456");
    // The order of a reserved number is saved with it.
    await orders.save(anOrder({ number: "MG-2026-000123" }));
    expect((await orders.findByNumber("MG-2026-000123"))?.number).toBe(
      "MG-2026-000123",
    );
  });

  it("stores and returns deep copies", async () => {
    const orders = createInMemoryOrderRepository();
    const order = anOrder();
    await orders.save(order);

    order.customer.firstName = "Changed";
    const read = await orders.findByNumber("MG-2026-000123");
    expect(read?.customer.firstName).toBe("Ana");
    if (read) read.customer.firstName = "Changed again";
    expect(
      (await orders.findByNumber("MG-2026-000123"))?.customer.firstName,
    ).toBe("Ana");
  });

  it("returns null for an unknown number", async () => {
    const orders = createInMemoryOrderRepository();
    expect(await orders.findByNumber("MG-2026-000999")).toBeNull();
  });

  it("validates orders before storing them", async () => {
    const orders = createInMemoryOrderRepository();
    const order = anOrder();
    await expect(
      orders.save({ ...order, totals: { ...order.totals, total: 1 } }),
    ).rejects.toThrow();
  });

  it("never overwrites another order with the same number", async () => {
    const orders = createInMemoryOrderRepository();
    await orders.save(anOrder());
    await expect(
      orders.save(
        anOrder({ accessToken: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d" }),
      ),
    ).rejects.toThrow("MG-2026-000123");
  });

  it("updates the same order (e.g. its status) in place", async () => {
    const orders = createInMemoryOrderRepository();
    const order = anOrder();
    await orders.save(order);
    await orders.save(order);
    expect(await orders.findByNumber(order.number)).toEqual(order);
  });
});
