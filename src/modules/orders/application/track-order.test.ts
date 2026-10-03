// @vitest-environment node
import { describe, expect, it } from "vitest";
import { anOrder, fakeOrders } from "@/modules/orders/testing/order-builders";
import { createAttemptLimiter } from "@/shared/lib/attempt-limiter";
import { trackOrder } from "./track-order";

function setup(maxFailures = 2) {
  const order = anOrder();
  const { repository } = fakeOrders([order]);
  const attempts = createAttemptLimiter({ maxFailures, windowMs: 60_000 });
  return { order, deps: { orders: repository, attempts } };
}

const RIGHT = { number: "MG-2026-000123", email: "ana@correo.pe" };
const WRONG = { number: "MG-2026-999999", email: "ana@correo.pe" };

describe("trackOrder", () => {
  it("finds the order with its number and the buyer's email", async () => {
    const { order, deps } = setup();
    expect(
      await trackOrder(deps, {
        clientKeys: ["browser:a"],
        number: "mg 2026 000123",
        email: "ANA@correo.pe",
      }),
    ).toEqual({ ok: true, order });
  });

  it("answers the same for a wrong email and an unknown number, counting both", async () => {
    const { deps } = setup(3);
    const wrongEmail = await trackOrder(deps, {
      clientKeys: ["browser:a"],
      number: "MG-2026-000123",
      email: "otra@correo.pe",
    });
    const unknown = await trackOrder(deps, {
      clientKeys: ["browser:a"],
      ...WRONG,
    });

    expect(wrongEmail).toEqual({ ok: false, reason: "not_found" });
    expect(unknown).toEqual(wrongEmail);
    expect(deps.attempts.isBlocked("browser:a")).toBe(false);
    await trackOrder(deps, {
      clientKeys: ["browser:a"],
      number: "MG-2026-999998",
      email: "ana@correo.pe",
    });
    expect(deps.attempts.isBlocked("browser:a")).toBe(true);
  });

  it("refuses every lookup from a blocked client, even a right one", async () => {
    const { deps } = setup(1);
    await trackOrder(deps, { clientKeys: ["browser:a"], ...WRONG });

    expect(
      await trackOrder(deps, { clientKeys: ["browser:a"], ...RIGHT }),
    ).toEqual({ ok: false, reason: "too_many_attempts" });
    expect(
      (await trackOrder(deps, { clientKeys: ["browser:b"], ...RIGHT })).ok,
    ).toBe(true);
  });

  it("counts a failure on every key of the client and blocks when any key is blocked", async () => {
    const { deps } = setup(1);
    await trackOrder(deps, {
      clientKeys: ["browser:a", "address:203.0.113.7"],
      ...WRONG,
    });

    expect(deps.attempts.isBlocked("browser:a")).toBe(true);
    expect(deps.attempts.isBlocked("address:203.0.113.7")).toBe(true);
    // A fresh browser id behind the same trusted address stays blocked.
    expect(
      await trackOrder(deps, {
        clientKeys: ["browser:new", "address:203.0.113.7"],
        ...RIGHT,
      }),
    ).toEqual({ ok: false, reason: "too_many_attempts" });
  });

  it("does not count successful lookups", async () => {
    const { deps } = setup(1);
    for (let lookup = 0; lookup < 3; lookup += 1) {
      await trackOrder(deps, { clientKeys: ["browser:a"], ...RIGHT });
    }
    expect(deps.attempts.isBlocked("browser:a")).toBe(false);
  });

  it("throws without a client key: an unthrottled lookup is a bug", async () => {
    const { deps } = setup();
    await expect(
      trackOrder(deps, { clientKeys: [], ...RIGHT }),
    ).rejects.toThrow(RangeError);
  });
});
