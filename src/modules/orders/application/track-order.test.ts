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

describe("trackOrder", () => {
  it("finds the order with its number and the buyer's email", async () => {
    const { order, deps } = setup();
    expect(
      await trackOrder(deps, {
        clientKey: "1.2.3.4",
        number: "mg 2026 000123",
        email: "ANA@correo.pe",
      }),
    ).toEqual({ ok: true, order });
  });

  it("answers the same for a wrong email and an unknown number, counting both", async () => {
    const { deps } = setup(3);
    const wrongEmail = await trackOrder(deps, {
      clientKey: "1.2.3.4",
      number: "MG-2026-000123",
      email: "otra@correo.pe",
    });
    const unknown = await trackOrder(deps, {
      clientKey: "1.2.3.4",
      number: "MG-2026-999999",
      email: "ana@correo.pe",
    });

    expect(wrongEmail).toEqual({ ok: false, reason: "not_found" });
    expect(unknown).toEqual(wrongEmail);
    expect(deps.attempts.isBlocked("1.2.3.4")).toBe(false);
    await trackOrder(deps, {
      clientKey: "1.2.3.4",
      number: "MG-2026-999998",
      email: "ana@correo.pe",
    });
    expect(deps.attempts.isBlocked("1.2.3.4")).toBe(true);
  });

  it("refuses every lookup from a blocked client, even a right one", async () => {
    const { deps } = setup(1);
    await trackOrder(deps, {
      clientKey: "1.2.3.4",
      number: "MG-2026-999999",
      email: "ana@correo.pe",
    });

    const right = {
      number: "MG-2026-000123",
      email: "ana@correo.pe",
    };
    expect(await trackOrder(deps, { clientKey: "1.2.3.4", ...right })).toEqual({
      ok: false,
      reason: "too_many_attempts",
    });
    expect(
      (await trackOrder(deps, { clientKey: "5.6.7.8", ...right })).ok,
    ).toBe(true);
  });

  it("does not count successful lookups", async () => {
    const { deps } = setup(1);
    for (let lookup = 0; lookup < 3; lookup += 1) {
      await trackOrder(deps, {
        clientKey: "1.2.3.4",
        number: "MG-2026-000123",
        email: "ana@correo.pe",
      });
    }
    expect(deps.attempts.isBlocked("1.2.3.4")).toBe(false);
  });
});
