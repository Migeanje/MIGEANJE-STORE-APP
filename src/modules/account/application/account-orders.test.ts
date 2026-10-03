// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  anAccount,
  EMAIL_VERIFIED_AT,
} from "@/modules/account/testing/account-builders";
import { listCustomerOrders } from "@/modules/orders/application/list-customer-orders";
import type { Order } from "@/modules/orders/domain/order";
import { anOrder, fakeOrders } from "@/modules/orders/testing/order-builders";
import { listAccountOrders } from "./account-orders";

// The orders module's lookup, as the /cuenta routes pass it in.
function ordersLookup(orders: Order[]) {
  const { repository } = fakeOrders(orders);
  return vi.fn(async (email: string) =>
    (await listCustomerOrders(repository, email)).map(({ number }) => number),
  );
}

describe("listAccountOrders", () => {
  const placedWithAnasEmail = [
    anOrder({ number: "MG-2026-000001" }),
    anOrder({ number: "MG-2026-000002" }),
  ];

  it("lists the orders of the account's email once it is verified", async () => {
    const findOrders = ordersLookup(placedWithAnasEmail);

    const result = await listAccountOrders(
      anAccount({ emailVerifiedAt: EMAIL_VERIFIED_AT }),
      findOrders,
    );

    expect(findOrders).toHaveBeenCalledWith("ana@correo.pe");
    expect(result).toEqual({
      status: "listed",
      orders: expect.arrayContaining(["MG-2026-000001", "MG-2026-000002"]),
    });
  });

  it("lists nothing for an unverified email, even with orders placed with it", async () => {
    const findOrders = ordersLookup(placedWithAnasEmail);
    // Orders with that email exist: anyone who registered it would see them.
    expect(await findOrders("ana@correo.pe")).toHaveLength(2);
    findOrders.mockClear();

    const result = await listAccountOrders(anAccount(), findOrders);

    expect(result).toEqual({ status: "email_unverified" });
    expect(findOrders).not.toHaveBeenCalled();
  });

  it("lists nothing for an account stored before verification existed", async () => {
    const findOrders = ordersLookup(placedWithAnasEmail);
    const legacy = { ...anAccount(), emailVerifiedAt: undefined };

    expect(await listAccountOrders(legacy as never, findOrders)).toEqual({
      status: "email_unverified",
    });
    expect(findOrders).not.toHaveBeenCalled();
  });
});
