import type { CheckoutStep } from "@/modules/checkout/domain/checkout-draft";

/** Entry point: redirects to the first step still to do. */
export const CHECKOUT_PATH = "/checkout";

/** One page per step, so every step works without JavaScript. */
export const CHECKOUT_STEP_PATHS: Record<CheckoutStep, string> = {
  contact: "/checkout/contacto",
  receipt: "/checkout/comprobante",
  payment: "/checkout/pago",
};

/** Terms of purchase (page arrives in M9). */
export const TERMS_PATH = "/terminos";
