/** The confirmation page of an order (right after paying). */
export function orderConfirmationPath(number: string): string {
  return `/checkout/confirmacion/${encodeURIComponent(number)}`;
}

/** Public order status (M7): order number + email. */
export const ORDER_TRACKING_PATH = "/pedidos/seguimiento";

/** Tracking with the number already filled in. */
export function orderTrackingHref(number: string): string {
  return `${ORDER_TRACKING_PATH}?numero=${encodeURIComponent(number)}`;
}
