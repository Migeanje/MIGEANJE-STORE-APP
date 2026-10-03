// @vitest-environment node
import { describe, expect, it } from "vitest";
import { anOrder, fakeOrders } from "@/modules/orders/testing/order-builders";
import { listCustomerOrders } from "./list-customer-orders";

describe("listCustomerOrders", () => {
  const older = anOrder({
    number: "MG-2026-000001",
    placedAt: new Date("2026-09-01T15:00:00Z"),
  });
  const newer = anOrder({
    number: "MG-2026-000002",
    placedAt: new Date("2026-10-01T15:00:00Z"),
  });

  it("lists the orders placed with an email, newest first", async () => {
    const { repository } = fakeOrders([older, newer]);

    const orders = await listCustomerOrders(repository, "ana@correo.pe");

    expect(orders.map(({ number }) => number)).toEqual([
      "MG-2026-000002",
      "MG-2026-000001",
    ]);
  });

  it("normalizes the email (an account email is stored as typed)", async () => {
    const { repository } = fakeOrders([older]);

    expect(
      await listCustomerOrders(repository, " Ana@Correo.PE "),
    ).toHaveLength(1);
  });

  it("returns nothing for a blank email", async () => {
    const { repository } = fakeOrders([older]);

    expect(await listCustomerOrders(repository, "  ")).toEqual([]);
  });
});
