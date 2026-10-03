// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Cart } from "@/modules/cart/domain/cart";
import {
  aCart,
  aLine,
  CART_ID,
  NEW_CART_ID,
} from "@/modules/cart/testing/cart-builders";
import { createInMemoryCartRepository } from "./in-memory-cart-repository";

describe("createInMemoryCartRepository", () => {
  it("creates empty carts with fresh ids and finds them again", async () => {
    const ids = [CART_ID, NEW_CART_ID];
    const carts = createInMemoryCartRepository({
      createId: () => ids.shift() ?? "",
    });

    const first = await carts.create();
    const second = await carts.create();

    expect(first).toEqual(aCart([], CART_ID));
    expect(second).toEqual(aCart([], NEW_CART_ID));
    expect(await carts.get(CART_ID)).toEqual(first);
  });

  it("uses random UUIDs by default", async () => {
    const carts = createInMemoryCartRepository();

    const { id } = await carts.create();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await carts.create()).id).not.toBe(id);
  });

  it("answers null for an unknown id", async () => {
    expect(await createInMemoryCartRepository().get(CART_ID)).toBeNull();
  });

  it("saves and replaces a cart", async () => {
    const carts = createInMemoryCartRepository();

    await carts.save(aCart([aLine()]));
    await carts.save(aCart([aLine({ quantity: 2 })]));

    expect(await carts.get(CART_ID)).toEqual(aCart([aLine({ quantity: 2 })]));
  });

  it("keeps its own copies: changing a cart read or saved never changes the store", async () => {
    const carts = createInMemoryCartRepository();
    const saved = aCart([aLine()]);
    await carts.save(saved);

    saved.lines[0] = aLine({ quantity: 4 });
    const read = await carts.get(CART_ID);
    read?.lines.push(aLine({ sku: "ANK-A2687" }));

    expect(await carts.get(CART_ID)).toEqual(aCart([aLine()]));
  });

  it("refuses to store an invalid cart", async () => {
    const carts = createInMemoryCartRepository();
    const invalid: Cart = aCart([aLine({ quantity: 9 })]);

    await expect(carts.save(invalid)).rejects.toThrow();
    expect(await carts.get(CART_ID)).toBeNull();
  });

  it("shares carts between repositories built on the same store", async () => {
    const store = new Map<string, Cart>();
    await createInMemoryCartRepository({ store }).save(aCart([aLine()]));

    expect(await createInMemoryCartRepository({ store }).get(CART_ID)).toEqual(
      aCart([aLine()]),
    );
  });
});
