// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CLIENT_ID_COOKIE, identifyClient } from "./client-key";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
const setCookie = vi.fn((name: string, value: string) => jar.set(name, value));
const requestHeaders = new Headers();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: setCookie,
  }),
  headers: async () => requestHeaders,
}));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => {
  jar.clear();
  setCookie.mockClear();
  for (const name of [...requestHeaders.keys()]) requestHeaders.delete(name);
});

describe("identifyClient", () => {
  it("issues an anonymous httpOnly id on the first lookup and keys by it", async () => {
    const keys = await identifyClient();

    expect(setCookie).toHaveBeenCalledTimes(1);
    const [name, id, options] = setCookie.mock.calls[0] as unknown as [
      string,
      string,
      Record<string, unknown>,
    ];
    expect(name).toBe(CLIENT_ID_COOKIE);
    expect(id).toMatch(UUID);
    expect(options).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
    expect(keys).toEqual([`browser:${id}`]);
  });

  it("keeps the same id on later lookups", async () => {
    const first = await identifyClient();
    const second = await identifyClient();

    expect(second).toEqual(first);
    expect(setCookie).toHaveBeenCalledTimes(1);
  });

  it("ignores forwarding headers by default, so forging them changes nothing", async () => {
    const keys = await identifyClient();

    requestHeaders.set("x-forwarded-for", "203.0.113.7");
    requestHeaders.set("x-real-ip", "198.51.100.4");
    expect(await identifyClient()).toEqual(keys);

    requestHeaders.set("x-forwarded-for", "192.0.2.99, 10.0.0.1");
    expect(await identifyClient()).toEqual(keys);
  });

  it("replaces a malformed id instead of keying by what the client wrote", async () => {
    jar.set(CLIENT_ID_COOKIE, "victim-chosen-key");

    const [key] = await identifyClient();

    expect(key).not.toContain("victim-chosen-key");
    expect(jar.get(CLIENT_ID_COOKIE)).toMatch(UUID);
    expect(key).toBe(`browser:${jar.get(CLIENT_ID_COOKIE)}`);
  });

  it("adds the address the trusted proxy appended, never a forged entry", async () => {
    requestHeaders.set("x-forwarded-for", "6.6.6.6, 203.0.113.7");

    const keys = await identifyClient({ trustedProxyHops: 1 });

    expect(keys).toEqual([
      `browser:${jar.get(CLIENT_ID_COOKIE)}`,
      "address:203.0.113.7",
    ]);
  });

  it("adds no address when the request did not pass every trusted proxy", async () => {
    requestHeaders.set("x-forwarded-for", "203.0.113.7");
    expect(await identifyClient({ trustedProxyHops: 2 })).toHaveLength(1);
  });
});
