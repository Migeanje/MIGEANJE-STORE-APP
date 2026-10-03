// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { CART_COOKIE } from "@/modules/cart/infrastructure/cart-cookie";
import {
  addToCartAction,
  readCartAction,
  removeLineAction,
  updateQuantityAction,
} from "./actions";

vi.mock("server-only", () => ({}));

// One browser: a cookie jar the actions read and write.
const jar = new Map<string, string>();
const setCookie = vi.fn((name: string, value: string) => {
  jar.set(name, value);
});
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: setCookie,
  }),
}));

const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh: () => refresh() }));

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

async function cartLines() {
  const id = jar.get(CART_COOKIE);
  const cart = id ? await getCartRepository().get(id) : null;
  return cart?.lines.map(({ sku, quantity }) => [sku, quantity]) ?? [];
}

describe("readCartAction", () => {
  beforeEach(() => {
    jar.clear();
    setCookie.mockClear();
  });

  it("answers the lines of this browser's cart, without writing any cookie", async () => {
    expect(await readCartAction()).toEqual([]);

    await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "2" }));
    setCookie.mockClear();

    const lines = await readCartAction();
    expect(lines.map(({ sku, quantity }) => [sku, quantity])).toEqual([
      ["ANK-A2688", 2],
    ]);
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("answers an empty cart for an unknown cart id", async () => {
    jar.set(CART_COOKIE, crypto.randomUUID());
    expect(await readCartAction()).toEqual([]);
  });
});

describe("addToCartAction", () => {
  beforeEach(() => {
    jar.clear();
    setCookie.mockClear();
    refresh.mockClear();
  });

  it("adds the product, stores the cart id in the cookie and refreshes the page", async () => {
    const result = await addToCartAction(
      null,
      form({ sku: "ANK-A2688", cantidad: "2" }),
    );

    expect(result).toEqual({
      ok: true,
      message:
        "Agregaste 2 unidades de Prime Charger 100W, 3 puertos al carrito",
    });
    expect(setCookie).toHaveBeenCalledWith(
      CART_COOKIE,
      expect.stringMatching(/^[0-9a-f-]{36}$/),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await cartLines()).toEqual([["ANK-A2688", 2]]);
  });

  it("says which product was added", async () => {
    expect(
      await addToCartAction(
        null,
        form({ sku: "ANK-A121D-WHT", cantidad: "1" }),
      ),
    ).toEqual({
      ok: true,
      message: "Agregaste Nano Charger 45W Smart Display (Blanco) al carrito",
    });
  });

  it("keeps adding to the same cart", async () => {
    await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "1" }));
    await addToCartAction(null, form({ sku: "ANK-A121D-WHT", cantidad: "1" }));

    expect(await cartLines()).toEqual([
      ["ANK-A2688", 1],
      ["ANK-A121D-WHT", 1],
    ]);
  });

  it("explains a clamp to the backorder limit", async () => {
    const result = await addToCartAction(
      null,
      form({ sku: "ANK-A121D-WHT", cantidad: "3" }),
    );

    expect(result).toEqual({
      ok: true,
      message:
        "Agregaste 2 unidades de Nano Charger 45W Smart Display (Blanco) al carrito. Puedes pedir hasta 2 unidades de un producto en importación.",
    });
  });

  it("refuses more units once the limit is reached", async () => {
    await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "5" }));
    refresh.mockClear();

    expect(
      await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "1" })),
    ).toEqual({
      ok: false,
      message:
        "Ya tienes 5 unidades de Prime Charger 100W, 3 puertos en tu carrito. Puedes llevar hasta 5 unidades por producto.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refuses an unavailable product without creating a cart", async () => {
    expect(
      await addToCartAction(null, form({ sku: "APL-MFHP4", cantidad: "1" })),
    ).toEqual({
      ok: false,
      message: expect.stringMatching(
        /^No pudimos agregar .+: está agotado por ahora\.$/,
      ),
    });
    expect(setCookie).not.toHaveBeenCalled();
  });

  it.each([
    { sku: "NOPE-1", cantidad: "1" },
    { sku: "<script>", cantidad: "1" },
    { sku: "ANK-A2688", cantidad: "0" },
  ])("answers a friendly error for an invalid request %j", async (fields) => {
    expect(await addToCartAction(null, form(fields))).toEqual({
      ok: false,
      message:
        "No encontramos ese producto. Recarga la página e inténtalo de nuevo.",
    });
    expect(setCookie).not.toHaveBeenCalled();
  });
});

describe("updateQuantityAction", () => {
  beforeEach(async () => {
    jar.clear();
    await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "1" }));
    setCookie.mockClear();
    refresh.mockClear();
  });

  it("sets the quantity and refreshes", async () => {
    expect(
      await updateQuantityAction(
        null,
        form({ sku: "ANK-A2688", cantidad: "3" }),
      ),
    ).toEqual({
      ok: true,
      message: "Ahora tienes 3 unidades de Prime Charger 100W, 3 puertos.",
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await cartLines()).toEqual([["ANK-A2688", 3]]);
  });

  it("explains a clamp", async () => {
    expect(
      await updateQuantityAction(
        null,
        form({ sku: "ANK-A2688", cantidad: "8" }),
      ),
    ).toEqual({
      ok: true,
      message:
        "Ahora tienes 5 unidades de Prime Charger 100W, 3 puertos. Puedes llevar hasta 5 unidades por producto.",
    });
  });

  it("says when the product is no longer in the cart, and refreshes to show it", async () => {
    expect(
      await updateQuantityAction(
        null,
        form({ sku: "ANK-A121D-WHT", cantidad: "2" }),
      ),
    ).toEqual({ ok: false, message: "Ese producto ya no está en tu carrito." });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("rejects a quantity that is not a whole number from 1", async () => {
    expect(
      await updateQuantityAction(
        null,
        form({ sku: "ANK-A2688", cantidad: "0" }),
      ),
    ).toEqual({
      ok: false,
      message: "Escribe una cantidad de 1 o más, o quita el producto.",
    });
    expect(await cartLines()).toEqual([["ANK-A2688", 1]]);
  });
});

describe("removeLineAction", () => {
  beforeEach(async () => {
    jar.clear();
    await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "1" }));
    refresh.mockClear();
  });

  it("removes the line and refreshes", async () => {
    expect(await removeLineAction(null, form({ sku: "ANK-A2688" }))).toEqual({
      ok: true,
      message: "Quitaste Prime Charger 100W, 3 puertos del carrito.",
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await cartLines()).toEqual([]);
  });

  it("is calm about a line that is already gone", async () => {
    await removeLineAction(null, form({ sku: "ANK-A2688" }));

    expect(await removeLineAction(null, form({ sku: "ANK-A2688" }))).toEqual({
      ok: true,
      message: "Ese producto ya no estaba en tu carrito.",
    });
  });

  it("rejects a bad SKU", async () => {
    expect(await removeLineAction(null, form({ sku: "" }))).toEqual({
      ok: false,
      message:
        "No encontramos ese producto. Recarga la página e inténtalo de nuevo.",
    });
  });
});

describe("when the cart cannot be reached", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs the error and answers a friendly message", async () => {
    vi.stubEnv("DATA_SOURCE", "medusa");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await addToCartAction(null, form({ sku: "ANK-A2688", cantidad: "1" })),
    ).toEqual({
      ok: false,
      message:
        "No pudimos actualizar tu carrito. Inténtalo de nuevo en un momento.",
    });
    expect(
      await updateQuantityAction(
        null,
        form({ sku: "ANK-A2688", cantidad: "1" }),
      ),
    ).toMatchObject({ ok: false });
    expect(
      await removeLineAction(null, form({ sku: "ANK-A2688" })),
    ).toMatchObject({ ok: false });
    expect(log).toHaveBeenCalledTimes(3);
  });
});
