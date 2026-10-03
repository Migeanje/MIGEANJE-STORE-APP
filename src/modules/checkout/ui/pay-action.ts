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
