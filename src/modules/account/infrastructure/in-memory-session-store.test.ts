// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NOW } from "@/modules/account/testing/account-builders";
import {
  createInMemorySessionStore,
  SESSION_TOKEN_PATTERN,
} from "./in-memory-session-store";

describe("createInMemorySessionStore", () => {
  it("issues a random 256-bit token for a 7-day session", async () => {
    const sessions = createInMemorySessionStore();

    const first = await sessions.create("cliente-1", NOW);
    const second = await sessions.create("cliente-1", NOW);

    expect(first.token).toMatch(SESSION_TOKEN_PATTERN);
    expect(first.token).not.toBe(second.token);
    expect(first.session).toEqual({
      customerId: "cliente-1",
      createdAt: "2026-10-03T15:00:00.000Z",
      expiresAt: "2026-10-10T15:00:00.000Z",
    });
    expect(await sessions.find(first.token, NOW)).toEqual(first.session);
  });

  it("forgets a session once it expires", async () => {
    const sessions = createInMemorySessionStore();
    const { token } = await sessions.create("cliente-1", NOW);

    expect(
      await sessions.find(token, new Date("2026-10-10T15:00:00Z")),
    ).toBeNull();
    // Gone for good, even with an earlier clock.
    expect(await sessions.find(token, NOW)).toBeNull();
  });

  it("revokes a session", async () => {
    const sessions = createInMemorySessionStore();
    const { token } = await sessions.create("cliente-1", NOW);

    await sessions.revoke(token);
    await sessions.revoke("desconocido");

    expect(await sessions.find(token, NOW)).toBeNull();
  });

  it("only keeps a digest of each token", async () => {
    const store = new Map();
    const sessions = createInMemorySessionStore({ store });
    const { token } = await sessions.create("cliente-1", NOW);

    expect([...store.keys()]).toHaveLength(1);
    expect([...store.keys()][0]).not.toContain(token);
  });

  it("drops expired sessions when it issues a new one", async () => {
    const store = new Map();
    const sessions = createInMemorySessionStore({ store });
    await sessions.create("cliente-1", NOW);

    await sessions.create("cliente-2", new Date("2026-10-11T00:00:00Z"));

    expect(store.size).toBe(1);
  });

  it("answers null for junk tokens", async () => {
    const sessions = createInMemorySessionStore();
    expect(await sessions.find("", NOW)).toBeNull();
    expect(await sessions.find("x".repeat(500), NOW)).toBeNull();
  });
});
