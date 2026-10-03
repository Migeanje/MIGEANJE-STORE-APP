// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_ACCOUNT } from "./fixtures/demo-account";
import {
  getCustomerAccounts,
  getDemoAccountHint,
  getLoginAttempts,
  getPasswordHasher,
  getSessionStore,
} from "./index";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("account composition root", () => {
  it("keeps one mock store per process, seeded with the demo account", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    expect(getCustomerAccounts()).toBe(getCustomerAccounts());
    expect(getSessionStore()).toBe(getSessionStore());
    expect(await getCustomerAccounts().findById(DEMO_ACCOUNT.id)).toEqual(
      DEMO_ACCOUNT,
    );
    expect(
      (await getCustomerAccounts().findCredentials(DEMO_ACCOUNT.email))
        ?.accountId,
    ).toBe(DEMO_ACCOUNT.id);
  });

  it("hints the demo account only for mock data", () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(getDemoAccountHint()).toEqual({
      email: "demo@migeanje.pe",
      password: "Demo-2026!",
    });

    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(getDemoAccountHint()).toBeNull();
  });

  it("throws for Medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(() => getCustomerAccounts()).toThrow("F3");
    expect(() => getSessionStore()).toThrow("F3");
  });

  it("hashes with scrypt", async () => {
    expect((await getPasswordHasher().hash("Demo-2026!")).algorithm).toBe(
      "scrypt",
    );
  });

  it("pauses a client after 10 failed sign-ins", () => {
    const attempts = getLoginAttempts();
    expect(attempts).toBe(getLoginAttempts());
    const key = `browser:${crypto.randomUUID()}`;
    for (let n = 0; n < 9; n += 1) attempts.recordFailure(key);
    expect(attempts.isBlocked(key)).toBe(false);
    attempts.recordFailure(key);
    expect(attempts.isBlocked(key)).toBe(true);
  });
});
