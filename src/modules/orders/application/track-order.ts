import type { Order } from "@/modules/orders/domain/order";
import type { AttemptLimiter } from "@/shared/lib/attempt-limiter";
import { findOrder } from "./find-order";
import type { OrderRepository } from "./ports";

export type TrackOrderDeps = {
  orders: OrderRepository;
  /** Failed lookups per client key: slows down guessing numbers and emails. */
  attempts: AttemptLimiter;
};

export type TrackOrderInput = {
  /**
   * Who is asking: every key the limiter counts for this client (e.g. an
   * anonymous browser id and, behind trusted proxies, the address). At least
   * one.
   */
  clientKeys: readonly string[];
  number: string;
  email: string;
};

export type TrackOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "not_found" | "too_many_attempts" };

/**
 * An order looked up by its number and the buyer's email, throttled: the
 * public tracking and the confirmation of another browser both use it, with
 * one limiter, so their failures add up.
 * A wrong email answers like an unknown number and both count as a failure
 * on every key of the client; a client with any key blocked is refused
 * before the lookup, so a blocked client cannot tell right data from wrong
 * data. Throws a RangeError without client keys (it would not be throttled).
 */
export async function trackOrder(
  { orders, attempts }: TrackOrderDeps,
  { clientKeys, number, email }: TrackOrderInput,
): Promise<TrackOrderResult> {
  if (clientKeys.length === 0) {
    throw new RangeError("trackOrder needs at least one client key");
  }
  if (clientKeys.some((key) => attempts.isBlocked(key))) {
    return { ok: false, reason: "too_many_attempts" };
  }
  const order = await findOrder(orders, number, email);
  if (!order) {
    for (const key of clientKeys) attempts.recordFailure(key);
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, order };
}
