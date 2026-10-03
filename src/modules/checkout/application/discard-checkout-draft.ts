import type { CheckoutDraftRepository } from "./ports";

/** Forgets the draft of the cart, e.g. once its order is placed. */
export async function discardCheckoutDraft(
  drafts: CheckoutDraftRepository,
  cartId: string,
): Promise<void> {
  await drafts.delete(cartId);
}
