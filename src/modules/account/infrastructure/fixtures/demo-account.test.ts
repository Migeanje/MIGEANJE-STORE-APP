// @vitest-environment node
import { describe, expect, it } from "vitest";
import { customerAccountSchema } from "@/modules/account/domain/customer-account";
import { mockCatalog } from "@/modules/catalog/infrastructure/catalog.mock";
import {
  resolveUbigeo,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";
import { UBIGEO_FIXTURE } from "@/modules/checkout/infrastructure/fixtures/ubigeo";
import { DEMO_ORDER_EMAIL } from "@/modules/orders/infrastructure/fixtures/demo-orders";
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
