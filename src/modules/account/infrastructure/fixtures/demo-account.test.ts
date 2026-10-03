// @vitest-environment node
import { describe, expect, it } from "vitest";
import { listAccountOrders } from "@/modules/account/application/account-orders";
import {
  customerAccountSchema,
  isEmailVerified,
} from "@/modules/account/domain/customer-account";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import {
  resolveUbigeo,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";
import { UBIGEO_FIXTURE } from "@/modules/checkout/infrastructure/fixtures/ubigeo";
import { listCustomerOrders } from "@/modules/orders/application/list-customer-orders";
import {
  DEMO_ORDER_EMAIL,
  DEMO_ORDER_NUMBERS,
  demoOrders,
} from "@/modules/orders/infrastructure/fixtures/demo-orders";
import { fakeOrders } from "@/modules/orders/testing/order-builders";
import { createScryptPasswordHasher } from "../scrypt-password-hasher";
import {
  DEMO_ACCOUNT,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_ACCOUNT_PASSWORD_HASH,
} from "./demo-account";

describe("the demo account", () => {
  it("is a valid account that owns the demo orders", () => {
    expect(customerAccountSchema.parse(DEMO_ACCOUNT)).toEqual(DEMO_ACCOUNT);
    expect(DEMO_ACCOUNT.email).toBe(DEMO_ORDER_EMAIL);
  });

  it("has a verified email, so it lists the demo orders", async () => {
    const { repository } = fakeOrders(
      demoOrders(new Date("2026-10-03T15:00:00Z")),
    );

    const result = await listAccountOrders(DEMO_ACCOUNT, async (email) =>
      (await listCustomerOrders(repository, email)).map(({ number }) => number),
    );

    expect(isEmailVerified(DEMO_ACCOUNT)).toBe(true);
    expect(result.status).toBe("listed");
    expect(result.status === "listed" && result.orders.toSorted()).toEqual(
      Object.values(DEMO_ORDER_NUMBERS).toSorted(),
    );
  });

  it("signs in with its documented password", async () => {
    expect(DEMO_ACCOUNT_PASSWORD).toBe("Demo-2026!");
    expect(
      await createScryptPasswordHasher().verify(
        DEMO_ACCOUNT_PASSWORD,
        DEMO_ACCOUNT_PASSWORD_HASH,
      ),
    ).toBe(true);
  });

  it("only saves products of the catalog", () => {
    const slugs = new Set(mockCatalog.products.map(({ slug }) => slug));
    expect(DEMO_ACCOUNT.favorites.length).toBeGreaterThan(0);
    for (const slug of DEMO_ACCOUNT.favorites) expect(slugs).toContain(slug);
  });

  it("only uses places of the mock ubigeo", () => {
    const tree = ubigeoTreeSchema.parse(UBIGEO_FIXTURE);
    for (const { ubigeo } of DEMO_ACCOUNT.addresses) {
      expect(
        resolveUbigeo(tree, {
          departamento: ubigeo.departamento.code,
          provincia: ubigeo.provincia.code,
          distrito: ubigeo.distrito.code,
        }),
      ).toEqual(ubigeo);
    }
  });
});
