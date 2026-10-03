// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { CART_ID } from "@/modules/cart/testing/cart-builders";
import { getCheckoutDraftRepository, getUbigeoDirectory } from "./index";

vi.mock("server-only", () => ({}));

describe("checkout composition root", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses one process-wide in-memory draft store for DATA_SOURCE=mock (or unset)", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const drafts = getCheckoutDraftRepository();
    await drafts.save({ cartId: CART_ID, contact: null, receipt: null });

    vi.stubEnv("DATA_SOURCE", undefined);
    expect(getCheckoutDraftRepository()).toBe(drafts);
    expect(await getCheckoutDraftRepository().get(CART_ID)).toEqual({
      cartId: CART_ID,
      contact: null,
      receipt: null,
    });
  });

  it("serves the mock ubigeo", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    expect(await getUbigeoDirectory().tree()).toHaveLength(25);
  });

  it("throws a clear error for DATA_SOURCE=medusa until F3", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");
    expect(() => getCheckoutDraftRepository()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
    expect(() => getUbigeoDirectory()).toThrow(
      "DATA_SOURCE=medusa is not implemented yet",
    );
  });

  it("throws for an unknown DATA_SOURCE", () => {
    vi.stubEnv("DATA_SOURCE", "postgres");
    expect(() => getCheckoutDraftRepository()).toThrow(
      'Unknown DATA_SOURCE "postgres"',
    );
  });
});
