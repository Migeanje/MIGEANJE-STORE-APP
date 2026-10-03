import type { Order } from "@/modules/orders/domain/order";
import type { AttemptLimiter } from "@/shared/lib/attempt-limiter";
import { findOrder } from "./find-order";
import type { OrderRepository } from "./ports";

export type TrackOrderDeps = {
  orders: OrderRepository;
  /** Failed lookups per client: slows down guessing numbers and emails. */
  attempts: AttemptLimiter;
};

export type TrackOrderInput = {
  /** Who is asking (e.g. the client address). */
  clientKey: string;
  number: string;
  email: string;
};

export type TrackOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "not_found" | "too_many_attempts" };

/**
 * Public order tracking: the order with this number and buyer's email.
 * A wrong email answers like an unknown number and both count as a failure
 * of the client; a client with too many failures is refused before the
 * lookup, so a blocked client cannot tell right data from wrong data.
 */
export async function trackOrder(
  { orders, attempts }: TrackOrderDeps,
  { clientKey, number, email }: TrackOrderInput,
): Promise<TrackOrderResult> {
  if (attempts.isBlocked(clientKey)) {
    return { ok: false, reason: "too_many_attempts" };
  }
  const order = await findOrder(orders, number, email);
  if (!order) {
    attempts.recordFailure(clientKey);
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, order };
}
