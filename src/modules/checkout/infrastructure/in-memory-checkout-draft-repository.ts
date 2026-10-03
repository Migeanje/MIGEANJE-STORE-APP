import type { CheckoutDraftRepository } from "@/modules/checkout/application/ports";
import {
  type CheckoutDraft,
  checkoutDraftSchema,
} from "@/modules/checkout/domain/checkout-draft";

/**
 * CheckoutDraftRepository over a Map, for `DATA_SOURCE=mock` and tests.
 * Drafts are validated before they are stored (a bug fails loudly) and
 * deep-copied on every read and write.
 */
export function createInMemoryCheckoutDraftRepository(
  store: Map<string, CheckoutDraft> = new Map(),
): CheckoutDraftRepository {
  return {
    async get(cartId) {
      const draft = store.get(cartId);
      return draft ? structuredClone(draft) : null;
    },
    async save(draft) {
      const valid = checkoutDraftSchema.parse(draft);
      store.set(valid.cartId, structuredClone(valid));
    },
    async delete(cartId) {
      store.delete(cartId);
    },
  };
}
