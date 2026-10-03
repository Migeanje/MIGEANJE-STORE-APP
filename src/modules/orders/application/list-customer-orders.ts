import { normalizeEmail } from "@/modules/checkout/domain/customer";
import type { Order } from "@/modules/orders/domain/order";
import type { OrderRepository } from "./ports";

/**
 * The orders placed with an email (an account's "Mis pedidos"), newest
 * first. Only for an email the customer has proven to own: a signed-in
 * account whose email is verified (the account's `listAccountOrders` checks
 * it before calling this). Being signed in is not enough, since registering
 * does not prove the email. It is not throttled like the public lookup by
 * number + email.
 */
export async function listCustomerOrders(
  orders: OrderRepository,
  email: string,
): Promise<Order[]> {
  const normalized = normalizeEmail(email);
  if (normalized === "") return [];
  const found = await orders.findByEmail(normalized);
  return found.toSorted((a, b) => b.placedAt.localeCompare(a.placedAt));
}
