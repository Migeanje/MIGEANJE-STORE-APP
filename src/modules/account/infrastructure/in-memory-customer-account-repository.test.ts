// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_ID,
  anAccount,
  anAddress,
  fakeHash,
} from "@/modules/account/testing/account-builders";
import { createInMemoryCustomerAccountRepository } from "./in-memory-customer-account-repository";

describe("createInMemoryCustomerAccountRepository", () => {
  it("creates an account and finds it by id and its credentials by email", async () => {
    const accounts = createInMemoryCustomerAccountRepository();

    expect(await accounts.create(anAccount(), fakeHash("x"))).toBe("created");

    expect(await accounts.findById(ACCOUNT_ID)).toEqual(anAccount());
    expect(await accounts.findCredentials("ana@correo.pe")).toEqual({
      accountId: ACCOUNT_ID,
      password: fakeHash("x"),
    });
    expect(await accounts.findById("otra")).toBeNull();
    expect(await accounts.findCredentials("nadie@correo.pe")).toBeNull();
  });

  it("keeps one account per email", async () => {
    const accounts = createInMemoryCustomerAccountRepository();
    await accounts.create(anAccount(), fakeHash("x"));

    expect(
      await accounts.create(
        anAccount({ id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d" }),
        fakeHash("y"),
      ),
    ).toBe("email_taken");
    expect(await accounts.findCredentials("ana@correo.pe")).toEqual({
      accountId: ACCOUNT_ID,
      password: fakeHash("x"),
    });
  });

  it("saves changes to an existing account, never its email", async () => {
    const accounts = createInMemoryCustomerAccountRepository();
    await accounts.create(anAccount(), fakeHash("x"));

    await accounts.save(anAccount({ firstName: "Ana María" }));
    expect((await accounts.findById(ACCOUNT_ID))?.firstName).toBe("Ana María");

    await expect(
      accounts.save(anAccount({ email: "otra@correo.pe" })),
    ).rejects.toThrow("email");
    await expect(
      accounts.save(anAccount({ id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d" })),
    ).rejects.toThrow("Unknown account");
  });

  it("validates accounts and hashes before storing them", async () => {
    const accounts = createInMemoryCustomerAccountRepository();
    await expect(
      accounts.create(anAccount({ email: "No Es Correo" }), fakeHash("x")),
    ).rejects.toThrow();
    await expect(
      accounts.create(anAccount(), { ...fakeHash("x"), cost: 3 }),
    ).rejects.toThrow();
    await accounts.create(anAccount(), fakeHash("x"));
    await expect(
      accounts.save(anAccount({ defaultAddressId: "x" })),
    ).rejects.toThrow();
  });

  it("hands out copies: changing one never changes the store", async () => {
    const accounts = createInMemoryCustomerAccountRepository();
    const account = anAccount();
    await accounts.create(account, fakeHash("x"));
    account.firstName = "Cambiado";

    const found = await accounts.findById(ACCOUNT_ID);
    if (!found) throw new Error("expected the account");
    found.addresses.push(anAddress());

    expect(await accounts.findById(ACCOUNT_ID)).toEqual(anAccount());
  });
});
