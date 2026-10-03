import * as z from "zod";
import { normalizeEmail } from "@/modules/checkout/domain/customer";
import { CONTACT_MESSAGES } from "@/modules/checkout/ui/checkout-copy";
import {
  type FormState,
  initialFormState,
} from "@/modules/checkout/ui/checkout-forms";
import {
  normalizeOrderNumber,
  ORDER_NUMBER_PATTERN,
} from "@/modules/orders/domain/order";
import { TRACKING_COPY } from "./order-copy";

/*
 * The order tracking form at the UI boundary: two text fields validated with
 * the same Zod schema on the client (inline errors) and in the server action.
 * The form posts (never GET), so the email stays out of URLs and logs.
 */

export const TRACKING_FIELDS = ["number", "email"] as const;
export type TrackingField = (typeof TRACKING_FIELDS)[number];
export type TrackingFormState = FormState<TrackingField>;

const emailFormat = z.email();

export const trackingFormSchema = z.object({
  number: z
    .string()
    .trim()
    .min(1, TRACKING_COPY.numberRequired)
    .transform(normalizeOrderNumber)
    .pipe(z.string().regex(ORDER_NUMBER_PATTERN, TRACKING_COPY.numberInvalid)),
  email: z
    .string()
    .trim()
    .min(1, CONTACT_MESSAGES.emailRequired)
    .max(254, CONTACT_MESSAGES.emailInvalid)
    .refine(
      (email) => emailFormat.safeParse(normalizeEmail(email)).success,
      CONTACT_MESSAGES.emailInvalid,
    )
    .transform(normalizeEmail),
});

// Longer input from the URL is junk, not an order number.
const MAX_URL_NUMBER_LENGTH = 32;

/**
 * The form for a page opened with `?numero=` (the confirmation's tracking
 * link): only a well-formed number is prefilled, never the email.
 */
export function trackingInitialState(
  numero: string | undefined,
): TrackingFormState {
  if (numero === undefined || numero.length > MAX_URL_NUMBER_LENGTH) {
    return initialFormState();
  }
  const number = normalizeOrderNumber(numero);
  return ORDER_NUMBER_PATTERN.test(number)
    ? initialFormState({ number })
    : initialFormState();
}
