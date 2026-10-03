// Reading the checkout in Server Components (the step pages).
import "server-only";
import { cache } from "react";
import type { Cart } from "@/modules/cart/domain/cart";
import { loadCart } from "@/modules/cart/ui/cart-data";
import { getCheckoutDraft } from "@/modules/checkout/application/get-checkout-draft";
import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import { getCheckoutDraftRepository } from "@/modules/checkout/infrastructure";

export type CheckoutData = { cart: Cart; draft: CheckoutDraft };

/**
 * The cart of this request with its checkout draft (an empty draft when the
 * customer has not started), or null when the cart is missing or empty.
 * Cached per request.
 */
export const loadCheckout = cache(async (): Promise<CheckoutData | null> => {
  const cart = await loadCart();
  if (!cart || cart.lines.length === 0) return null;
  const draft = await getCheckoutDraft(getCheckoutDraftRepository(), cart.id);
  return draft ? { cart, draft } : null;
});
