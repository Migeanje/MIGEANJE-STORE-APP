import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import type { UbigeoTree } from "@/modules/checkout/domain/ubigeo";

/**
 * Port: where checkout drafts are kept, one per cart (in memory for
 * `DATA_SOURCE=mock`; the Medusa cart's own fields in F3).
 */
export interface CheckoutDraftRepository {
  /** The draft of the cart, or null when the customer has not started. */
  get(cartId: string): Promise<CheckoutDraft | null>;
  /** Stores the draft, replacing the one of the same cart. */
  save(draft: CheckoutDraft): Promise<void>;
  /** Forgets the draft of the cart (after the order is placed). */
  delete(cartId: string): Promise<void>;
}

/** Port: Peru's departamentos, provincias and distritos (INEI ubigeo). */
export interface UbigeoDirectory {
  tree(): Promise<UbigeoTree>;
}
