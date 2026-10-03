// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_ORDER_EMAIL } from "@/modules/orders/infrastructure/fixtures/demo-orders";
import { anOrder } from "@/modules/orders/testing/order-builders";
import { customerOrderSummary, findCustomerOrders } from "./customer-orders";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("customerOrderSummary", () => {
  it("summarizes an order for the account's order list", () => {
    expect(customerOrderSummary(anOrder())).toEqual({
      number: "MG-2026-000123",
      placedOn: { label: "2 de octubre de 2026", dateTime: "2026-10-02" },
      status: "Pagado",
      total: anOrder().totals.total,
      itemCountLabel: "2 productos",
      trackingHref: "/pedidos/seguimiento?numero=MG-2026-000123",
      detailHref: "/checkout/confirmacion/MG-2026-000123",
    });
  });
});

describe("findCustomerOrders", () => {
  it("lists the demo orders of the demo email, newest first", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    const orders = await findCustomerOrders(DEMO_ORDER_EMAIL.toUpperCase());

    // The order on its way was placed after the one still importing.
    expect(orders.map(({ status }) => status)).toEqual([
      "En camino",
      "En importación",
      "Entregado",
    ]);
    const dates = orders.map(({ placedOn }) => placedOn.dateTime);
    expect(dates).toEqual(dates.toSorted().reverse());
  });

  it("finds nothing for an email without orders", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    expect(await findCustomerOrders("nadie@correo.pe")).toEqual([]);
  });
});
