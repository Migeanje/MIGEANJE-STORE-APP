// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  anAccount,
  anAttemptLimiter,
  fakeAccounts,
  fakeHasher,
  fakeSessions,
  NOW,
} from "@/modules/account/testing/account-builders";
import { logIn } from "./log-in";

function setup() {
  const accounts = fakeAccounts([
    { account: anAccount(), password: "Clave-segura-1" },
  ]);
  const hasher = fakeHasher();
  const sessions = fakeSessions();
  const attempts = anAttemptLimiter();
  const deps = {
    accounts: accounts.repository,
    hasher: hasher.hasher,
    sessions: sessions.store,
    attempts,
  };
  const input = {
    clientKeys: ["browser:1"],
    email: "ana@correo.pe",
    password: "Clave-segura-1",
    now: NOW,
    previousToken: null,
  };
  return { deps, input, hasher, sessions, attempts };
}

describe("logIn", () => {
  it("opens a 7-day session for the right email and password", async () => {
    const { deps, input } = setup();

    const result = await logIn(deps, input);

    expect(result).toEqual({
      ok: true,
      account: anAccount(),
      issued: {
        token: "token-1",
        session: {
          customerId: anAccount().id,
          createdAt: "2026-10-03T15:00:00.000Z",
          expiresAt: "2026-10-10T15:00:00.000Z",
        },
      },
    });
  });

  it("ignores case and spaces in the email", async () => {
    const { deps, input } = setup();
    expect(
      (await logIn(deps, { ...input, email: "  ANA@correo.pe " })).ok,
    ).toBe(true);
  });

  it("answers the same for a wrong password and an unknown email", async () => {
    const { deps, input, hasher } = setup();

    expect(await logIn(deps, { ...input, password: "otra-clave-1" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    expect(await logIn(deps, { ...input, email: "nadie@correo.pe" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    // An unknown email still runs the password check (same timing).
    expect(hasher.calls.verifyWithoutHash).toBe(1);
  });

  it("rotates the session: the previous token stops working", async () => {
    const { deps, input, sessions } = setup();
    const first = await logIn(deps, input);
    if (!first.ok) throw new Error("expected a session");

    const second = await logIn(deps, {
      ...input,
      previousToken: first.issued.token,
    });

    expect(second.ok && second.issued.token).toBe("token-2");
    expect(sessions.revoked).toEqual(["token-1"]);
    expect(await sessions.store.find("token-1", NOW)).toBeNull();
  });

  it("pauses a client after too many failures, even with the right password", async () => {
    const { deps, input, attempts } = setup();
    for (let n = 0; n < 3; n += 1) {
      await logIn(deps, { ...input, password: "mal" });
    }
    expect(attempts.isBlocked("browser:1")).toBe(true);

    expect(await logIn(deps, input)).toEqual({
      ok: false,
      reason: "too_many_attempts",
    });
    // Another client is not affected.
    expect(
      (await logIn(deps, { ...input, clientKeys: ["browser:2"] })).ok,
    ).toBe(true);
  });

  it("counts a failure on every key of the client", async () => {
    const { deps, input, attempts } = setup();
    for (let n = 0; n < 3; n += 1) {
      await logIn(deps, {
        ...input,
        clientKeys: ["browser:1", "address:203.0.113.7"],
        password: "mal",
      });
    }
    expect(attempts.isBlocked("address:203.0.113.7")).toBe(true);
  });

  it("does not count a successful sign-in", async () => {
    const { deps, input, attempts } = setup();
    await logIn(deps, input);
    expect(attempts.size()).toBe(0);
  });

  it("throws without client keys (it would not be throttled)", async () => {
    const { deps, input } = setup();
    await expect(logIn(deps, { ...input, clientKeys: [] })).rejects.toThrow(
      RangeError,
    );
  });
});
