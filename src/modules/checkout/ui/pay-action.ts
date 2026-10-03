import type { FormState, PaymentField } from "./checkout-forms";

/** What the payment step shows after a failed payment. */
export type PaymentFormState = FormState<PaymentField>;

/**
 * Extension point of the payment step: the server action that pays and
 * places the order. The checkout never imports the orders module; the
 * `/checkout/pago` route passes the orders module's `placeOrderAction`.
 * It parses the card with `paymentFormSchema`, redirects to the
 * confirmation on success and otherwise answers the errors. It must never
 * send card data back in `values`.
 */
export type PayAction = (
  previous: PaymentFormState,
  formData: FormData,
) => Promise<PaymentFormState>;

/** A payment of this cart that was charged and is being confirmed by hand. */
export type PendingPayment = {
  /** What the customer was told to quote (the reserved order number). */
  reference: string;
};

/**
 * Extension point of the payment step: whether this cart already has a
 * charged payment awaiting confirmation (its order could not be stored). The
 * `/checkout/pago` route passes the orders module's `findPendingPayment`;
 * with one, the step shows a notice instead of "Pagar".
 */
export type PendingPaymentLookup = (
  cartId: string,
) => Promise<PendingPayment | null>;
