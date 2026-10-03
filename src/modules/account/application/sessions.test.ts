// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  anAccount,
  fakeAccounts,
  fakeSessions,
  NOW,
} from "@/modules/account/testing/account-builders";
import { getSignedInAccount, logOut } from "./sessions";

describe("getSignedInAccount", () => {
  it("finds the account of an active session", async () => {
    const accounts = fakeAccounts([{ account: anAccount(), password: "x" }]);
    const sessions = fakeSessions();
    const { token } = await sessions.store.create(anAccount().id, NOW);
    const deps = { accounts: accounts.repository, sessions: sessions.store };

    expect(await getSignedInAccount(deps, token, NOW)).toEqual(anAccount());
    expect(await getSignedInAccount(deps, null, NOW)).toBeNull();
    expect(await getSignedInAccount(deps, "otro", NOW)).toBeNull();
    expect(
      await getSignedInAccount(deps, token, new Date("2026-10-11T00:00:00Z")),
    ).toBeNull();
  });

  it("answers null when the account no longer exists", async () => {
    const sessions = fakeSessions();
    const { token } = await sessions.store.create("borrada", NOW);
    expect(
      await getSignedInAccount(
        { accounts: fakeAccounts().repository, sessions: sessions.store },
        token,
        NOW,
      ),
    ).toBeNull();
  });
});

describe("logOut", () => {
  it("revokes the session of the token (if any)", async () => {
    const sessions = fakeSessions();
    const { token } = await sessions.store.create("cliente", NOW);

    await logOut(sessions.store, token);
    await logOut(sessions.store, null);

    expect(sessions.revoked).toEqual([token]);
    expect(await sessions.store.find(token, NOW)).toBeNull();
  });
});
