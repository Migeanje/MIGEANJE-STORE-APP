// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN,
  anOrder,
  fakeOrders,
} from "@/modules/orders/testing/order-builders";
import { findOrder, findOrderWithAccessToken } from "./find-order";

describe("findOrder", () => {
  const order = anOrder();
  const { repository } = fakeOrders([order]);

  it("finds an order by number and the buyer's email", async () => {
    expect(
      await findOrder(repository, "MG-2026-000123", "ana@correo.pe"),
    ).toEqual(order);
  });

  it("ignores case and surrounding spaces in what the customer types", async () => {
    expect(
      await findOrder(repository, " mg-2026-000123 ", " Ana@Correo.PE "),
    ).toEqual(order);
    expect(
      await findOrder(repository, "mg 2026 000123", "ana@correo.pe"),
    ).toEqual(order);
  });

  it("returns null for another email, an unknown number or junk", async () => {
    expect(
      await findOrder(repository, "MG-2026-000123", "otra@correo.pe"),
    ).toBeNull();
    expect(
      await findOrder(repository, "MG-2026-000999", "ana@correo.pe"),
    ).toBeNull();
    expect(await findOrder(repository, "123", "ana@correo.pe")).toBeNull();
    expect(await findOrder(repository, "MG-2026-000123", "")).toBeNull();
  });
});

describe("findOrderWithAccessToken", () => {
  const order = anOrder();
  const { repository } = fakeOrders([order]);

  it("finds the order whose access token matches", async () => {
    expect(
      await findOrderWithAccessToken(
        repository,
        "MG-2026-000123",
        ACCESS_TOKEN,
      ),
    ).toEqual(order);
  });

  it("returns null for another token or number", async () => {
    expect(
      await findOrderWithAccessToken(
        repository,
        "MG-2026-000123",
        "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
      ),
    ).toBeNull();
    expect(
      await findOrderWithAccessToken(
        repository,
        "MG-2026-000124",
        ACCESS_TOKEN,
      ),
    ).toBeNull();
    expect(
      await findOrderWithAccessToken(repository, "MG-2026-000123", ""),
    ).toBeNull();
  });
});
