import {
  type CheckoutDraft,
  emptyDraft,
} from "@/modules/checkout/domain/checkout-draft";
import type { CheckoutDraftRepository } from "./ports";

/**
 * The draft of the cart `cartId` (the cart cookie): the saved one, or an
 * empty one (not stored) when the customer has not started. Null without a
 * cart id.
 */
export async function getCheckoutDraft(
  drafts: CheckoutDraftRepository,
  cartId: string | undefined,
): Promise<CheckoutDraft | null> {
  if (cartId === undefined) return null;
  return (await drafts.get(cartId)) ?? emptyDraft(cartId);
}
