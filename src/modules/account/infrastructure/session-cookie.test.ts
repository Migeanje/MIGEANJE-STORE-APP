// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionToken,
  readSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  writeSessionToken,
} from "./session-cookie";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
const set = vi.fn((name: string, value: string, _options?: object) =>
  jar.set(name, value),
);
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set,
  }),
}));

const TOKEN = "q83vEjRWeJCrze8SNFZ4kKvN7xI0VniQq83vEjRWeJA";

describe("session cookie", () => {
  beforeEach(() => {
    jar.clear();
    set.mockClear();
  });

  it("is mg_session: httpOnly, SameSite=Lax, Secure in production, every path", () => {
    expect(SESSION_COOKIE).toBe("mg_session");
    const expires = new Date("2026-10-10T15:00:00Z");
    expect(sessionCookieOptions(expires, true)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      expires,
    });
    expect(sessionCookieOptions(expires, false).secure).toBe(false);
  });

  it("writes the token until the session expires and reads it back", async () => {
    const expires = new Date("2026-10-10T15:00:00Z");
    await writeSessionToken(TOKEN, expires);

    expect(set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      TOKEN,
      expect.objectContaining({ httpOnly: true, expires }),
    );
    expect(await readSessionToken()).toBe(TOKEN);
  });

  it("reads null for a missing or malformed cookie", async () => {
    expect(await readSessionToken()).toBeNull();
    jar.set(SESSION_COOKIE, "no es un token");
    expect(await readSessionToken()).toBeNull();
  });

  it("clears the cookie", async () => {
    jar.set(SESSION_COOKIE, TOKEN);
    await clearSessionToken();
    expect(set).toHaveBeenCalledWith(
      SESSION_COOKIE,
      "",
      expect.objectContaining({ httpOnly: true, path: "/", maxAge: 0 }),
    );
    expect(await readSessionToken()).toBeNull();
  });
});
