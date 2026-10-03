// The orders of a signed-in customer, for the account pages (the routes pass
// `findCustomerOrders` to the account module). Server-only: it reads the
// orders repository.
import "server-only";
import { itemCountLabel } from "@/modules/cart/ui/cart-copy";
import { listCustomerOrders } from "@/modules/orders/application/list-customer-orders";
import { currentStatus, type Order } from "@/modules/orders/domain/order";
import { getOrderRepository } from "@/modules/orders/infrastructure";
import { ORDER_STATUS_LABELS } from "./order-copy";
import { orderConfirmationPath, orderTrackingHref } from "./order-paths";
import { orderPlacedOn } from "./order-tracking-view";

/** One order in "Mis pedidos". */
export type CustomerOrderSummary = {
  number: string;
  placedOn: { label: string; dateTime: string };
  /** Current status: "En camino". */
  status: string;
  /** In céntimos. */
  total: number;
  itemCountLabel: string;
  /** Public tracking with the number filled in. */
  trackingHref: string;
  /** The full confirmation (opens with the access cookie or the email). */
  detailHref: string;
};

export function customerOrderSummary(order: Order): CustomerOrderSummary {
  const units = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    number: order.number,
    placedOn: orderPlacedOn(order),
    status: ORDER_STATUS_LABELS[currentStatus(order)],
    total: order.totals.total,
    itemCountLabel: itemCountLabel(units),
    trackingHref: orderTrackingHref(order.number),
    detailHref: orderConfirmationPath(order.number),
  };
}

/**
 * The orders placed with an email, newest first. Only for an email the
 * caller has proven to own (the signed-in account's): it is not throttled
 * like the public lookup, and it never says anything about other emails.
 */
export async function findCustomerOrders(
  email: string,
): Promise<CustomerOrderSummary[]> {
  const orders = await listCustomerOrders(getOrderRepository(), email);
  return orders.map(customerOrderSummary);
}
