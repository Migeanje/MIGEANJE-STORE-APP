import { normalizeEmail } from "@/modules/checkout/domain/customer";
import {
  normalizeOrderNumber,
  ORDER_NUMBER_PATTERN,
  type Order,
} from "@/modules/orders/domain/order";
import type { OrderRepository } from "./ports";

/**
 * Public lookup (order tracking): the order with this number whose buyer
 * used this email, or null. Both inputs are what a customer typed (trimmed,
 * case-insensitive). A wrong email answers like an unknown number, so the
 * lookup never reveals that an order exists.
 */
export async function findOrder(
  orders: OrderRepository,
  number: string,
  email: string,
): Promise<Order | null> {
  const normalized = normalizeOrderNumber(number);
  if (!ORDER_NUMBER_PATTERN.test(normalized)) return null;
  const order = await orders.findByNumber(normalized);
  return order && order.customer.email === normalizeEmail(email) ? order : null;
}

/**
 * The order whose secret access token matches (the confirmation page right
 * after paying), or null.
 */
export async function findOrderWithAccessToken(
  orders: OrderRepository,
  number: string,
  accessToken: string,
): Promise<Order | null> {
  if (!ORDER_NUMBER_PATTERN.test(number) || accessToken === "") return null;
  const order = await orders.findByNumber(number);
  return order && order.accessToken === accessToken ? order : null;
}
