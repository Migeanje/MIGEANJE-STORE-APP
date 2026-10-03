// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_ID,
  anAccount,
  anAttemptLimiter,
  fakeAccounts,
  fakeHash,
  fakeHasher,
  fakeSessions,
  NOW,
} from "@/modules/account/testing/account-builders";
import { registerCustomer } from "./register-customer";

const NEW_ID = "0d1e2f3a-4b5c-4d6e-8f70-8192a3b4c5d6";

function setup() {
  const accounts = fakeAccounts([
    { account: anAccount(), password: "Clave-segura-1" },
  ]);
  const sessions = fakeSessions();
  const attempts = anAttemptLimiter();
  const deps = {
    accounts: accounts.repository,
    hasher: fakeHasher().hasher,
    sessions: sessions.store,
    attempts,
    newId: () => NEW_ID,
  };
  const input = {
    clientKeys: ["browser:1"],
    firstName: "Luis",
    lastName: "Rojas",
    email: " Luis@Correo.PE ",
    phone: null,
    password: "Otra-clave-2",
    now: NOW,
    previousToken: "token-viejo",
  };
  return { deps, input, accounts, sessions, attempts };
}

describe("registerCustomer", () => {
  it("creates the account with a hashed password and signs it in", async () => {
    const { deps, input, accounts, sessions } = setup();

    const result = await registerCustomer(deps, input);

    const expected = {
      id: NEW_ID,
      firstName: "Luis",
      lastName: "Rojas",
      email: "luis@correo.pe",
      // Registering does not prove the email is Luis's.
      emailVerifiedAt: null,
      phone: null,
      document: null,
      addresses: [],
      defaultAddressId: null,
      favorites: [],
      createdAt: "2026-10-03T15:00:00.000Z",
    };
    expect(result).toMatchObject({ ok: true, account: expected });
    expect(result.ok && result.issued.token).toBe("token-1");
    expect(accounts.accounts.get(NEW_ID)).toEqual(expected);
    expect(await deps.accounts.findCredentials("luis@correo.pe")).toEqual({
      accountId: NEW_ID,
      password: fakeHash("Otra-clave-2"),
    });
    // A session from before (maybe another account) is closed.
    expect(sessions.revoked).toEqual(["token-viejo"]);
  });

  it("refuses an email that already has an account and counts it as a failure", async () => {
    const { deps, input, attempts } = setup();

    const result = await registerCustomer(deps, {
      ...input,
      email: "ANA@correo.pe",
    });

    expect(result).toEqual({ ok: false, reason: "email_taken" });
    expect(attempts.size()).toBe(1);
    expect((await deps.accounts.findById(ACCOUNT_ID))?.firstName).toBe("Ana");
  });

  it("pauses a client that keeps hitting existing emails", async () => {
    const { deps, input } = setup();
    for (let n = 0; n < 3; n += 1) {
      await registerCustomer(deps, { ...input, email: "ana@correo.pe" });
    }
    expect(await registerCustomer(deps, input)).toEqual({
      ok: false,
      reason: "too_many_attempts",
    });
  });

  it("throws for a password the form should have refused", async () => {
    const { deps, input } = setup();
    await expect(
      registerCustomer(deps, { ...input, password: "corta" }),
    ).rejects.toThrow(RangeError);
  });

  it("throws for data the form should have refused", async () => {
    const { deps, input } = setup();
    await expect(
      registerCustomer(deps, { ...input, phone: "123" }),
    ).rejects.toThrow();
  });

  it("throws without client keys (it would not be throttled)", async () => {
    const { deps, input } = setup();
    await expect(
      registerCustomer(deps, { ...input, clientKeys: [] }),
    ).rejects.toThrow(RangeError);
  });
});
