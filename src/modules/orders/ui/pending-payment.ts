// The checkout's `PendingPaymentLookup`, for the /checkout/pago route.
// Server-only: it reads the reconciliation log.
import "server-only";
import type { PendingPaymentLookup } from "@/modules/checkout/ui/pay-action";
import { getReconciliationLog } from "@/modules/orders/infrastructure";

/**
 * Whether this cart has a payment that was charged but whose order could not
 * be stored (pending reconciliation). Only the reference (the reserved order
 * number) leaves the orders module, never the order's personal data.
 */
export const findPendingPayment: PendingPaymentLookup = async (cartId) => {
  const pending = await getReconciliationLog().findByCart(cartId);
  return pending ? { reference: pending.order.number } : null;
};
