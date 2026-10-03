// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CART_ID } from "@/modules/cart/testing/cart-builders";
import {
  CART_COOKIE,
  cartCookieOptions,
  readCartId,
  writeCartId,
} from "./cart-cookie";

vi.mock("server-only", () => ({}));

const jar = new Map<string, string>();
const set = vi.fn((name: string, value: string) => {
  jar.set(name, value);
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set,
  }),
}));

describe("cart cookie", () => {
  beforeEach(() => {
    jar.clear();
    set.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is named mg_cart and lives 30 days, httpOnly, SameSite=Lax, on every path", () => {
    expect(CART_COOKIE).toBe("mg_cart");
    expect(cartCookieOptions(false)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it("is Secure in production", () => {
    expect(cartCookieOptions(true).secure).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(cartCookieOptions().secure).toBe(true);
    vi.stubEnv("NODE_ENV", "development");
    expect(cartCookieOptions().secure).toBe(false);
  });

  it("reads the cart id", async () => {
    jar.set(CART_COOKIE, CART_ID);

    expect(await readCartId()).toBe(CART_ID);
  });

  it.each(["", "cart-1", `${CART_ID}x`, "<script>"])(
    "ignores a cookie that is not a cart id (%s)",
    async (value) => {
      jar.set(CART_COOKIE, value);

      expect(await readCartId()).toBeUndefined();
    },
  );

  it("answers undefined without a cookie", async () => {
    expect(await readCartId()).toBeUndefined();
  });

  it("writes the cart id with the cookie options", async () => {
    vi.stubEnv("NODE_ENV", "test");

    await writeCartId(CART_ID);

    expect(set).toHaveBeenCalledWith(
      CART_COOKIE,
      CART_ID,
      cartCookieOptions(false),
    );
  });

  it("refuses to write something that is not a cart id", async () => {
    await expect(writeCartId("cart-1")).rejects.toThrow();
    expect(set).not.toHaveBeenCalled();
  });
});
