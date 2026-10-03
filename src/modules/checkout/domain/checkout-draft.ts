import * as z from "zod";
import { cartIdSchema } from "@/modules/cart/domain/cart";
import { customerSchema } from "./customer";
import { receiptSchema } from "./receipt";
import { resolvedUbigeoSchema } from "./ubigeo";

/*
 * The checkout draft: what the customer filled in so far, kept on the server
 * per cart (the cart cookie is the key). Each step replaces its part; payment
 * reads the whole draft and never stores card data in it.
 */

export const shippingAddressSchema = z.strictObject({
  /** Street, number, apartment. */
  line: z.string().trim().min(1).max(150),
  /** How the courier finds it; may be empty. */
  reference: z.string().trim().max(150),
  ubigeo: resolvedUbigeoSchema,
});

/** Step 1: who buys and where it goes. */
export const contactDetailsSchema = z.strictObject({
  customer: customerSchema,
  address: shippingAddressSchema,
});

export const checkoutDraftSchema = z.strictObject({
  cartId: cartIdSchema,
  contact: contactDetailsSchema.nullable(),
  /** Step 2: boleta (or factura when enabled). */
  receipt: receiptSchema.nullable(),
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type ContactDetails = z.infer<typeof contactDetailsSchema>;
export type CheckoutDraft = z.infer<typeof checkoutDraftSchema>;

export const CHECKOUT_STEPS = ["contact", "receipt", "payment"] as const;
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

/** A draft with nothing filled in. Throws when the cart id is not a UUID. */
export function emptyDraft(cartId: string): CheckoutDraft {
  return { cartId: cartIdSchema.parse(cartId), contact: null, receipt: null };
}

/** True when the draft has a receipt the store can issue right now. */
export function hasUsableReceipt(
  draft: CheckoutDraft,
  { facturaEnabled }: { facturaEnabled: boolean },
): boolean {
  return (
    draft.receipt !== null &&
    (draft.receipt.type === "boleta" || facturaEnabled)
  );
}

/**
 * The first step still to do. A factura saved while facturas were enabled
 * counts as missing once they are disabled, so the customer picks again.
 */
export function pendingStep(
  draft: CheckoutDraft,
  options: { facturaEnabled: boolean },
): CheckoutStep {
  if (draft.contact === null) return "contact";
  if (!hasUsableReceipt(draft, options)) return "receipt";
  return "payment";
}
