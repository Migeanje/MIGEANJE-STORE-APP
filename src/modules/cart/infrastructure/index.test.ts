// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCartRepository, getCartServices, getProductLookup } from "./index";

// Outside Next.js the real package throws on import; here it is a no-op.
vi.mock("server-only", () => ({}));

describe("cart composition root", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses one process-wide in-memory repository for DATA_SOURCE=mock (or unset)", () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const repository = getCartRepository();

    vi.stubEnv("DATA_SOURCE", undefined);
    expect(getCartRepository()).toBe(repository);
  });

  it("keeps carts across calls", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const cart = await getCartRepository().create();

    expect(await getCartRepository().get(cart.id)).toEqual(cart);
  });

  it("looks products up in the catalog of the same data source", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    expect(await getProductLookup().findOffer("ANK-A2688")).toMatchObject({
      unitPrice: 18990,
    });
    expect(getCartServices()).toEqual({
      carts: getCartRepository(),
      products: expect.objectContaining({ findOffer: expect.any(Function) }),
    });
  });

  it("throws a clear error for DATA_SOURCE=medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");

    expect(() => getCartRepository()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
  });

  it("throws for an unknown DATA_SOURCE", () => {
    vi.stubEnv("DATA_SOURCE", "postgres");

    expect(() => getCartRepository()).toThrow(
      'Unknown DATA_SOURCE "postgres". Expected one of: mock, medusa',
    );
  });
});
