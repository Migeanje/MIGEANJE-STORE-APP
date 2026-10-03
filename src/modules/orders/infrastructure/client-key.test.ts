// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readClientKey } from "./client-key";

vi.mock("server-only", () => ({}));

const requestHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders,
}));

beforeEach(() => {
  for (const name of [...requestHeaders.keys()]) requestHeaders.delete(name);
});

describe("readClientKey", () => {
  it("uses the first address of x-forwarded-for", async () => {
    requestHeaders.set("x-forwarded-for", " 203.0.113.7 , 10.0.0.1");
    requestHeaders.set("x-real-ip", "10.0.0.2");
    expect(await readClientKey()).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to one shared key", async () => {
    requestHeaders.set("x-real-ip", "198.51.100.4");
    expect(await readClientKey()).toBe("198.51.100.4");

    requestHeaders.delete("x-real-ip");
    expect(await readClientKey()).toBe("unknown");
  });
});
