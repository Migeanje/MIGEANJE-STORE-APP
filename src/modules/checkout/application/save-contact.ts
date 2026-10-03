import {
  type CheckoutDraft,
  emptyDraft,
} from "@/modules/checkout/domain/checkout-draft";
import type { Customer } from "@/modules/checkout/domain/customer";
import {
  resolveUbigeo,
  type UbigeoCodes,
} from "@/modules/checkout/domain/ubigeo";
import type { CheckoutDraftRepository, UbigeoDirectory } from "./ports";

/** Step 1 as the form sends it: the ubigeo as codes only. */
export type ContactInput = {
  customer: Customer;
  address: { line: string; reference: string; ubigeo: UbigeoCodes };
};

export type SaveContactResult =
  | { ok: true; draft: CheckoutDraft }
  | { ok: false; error: "unknown_ubigeo" };

/**
 * Stores who buys and where it goes, with the ubigeo names looked up in the
 * directory (a distrito of another provincia is refused). Keeps the rest of
 * the draft.
 */
export async function saveContact(
  services: { drafts: CheckoutDraftRepository; ubigeo: UbigeoDirectory },
  cartId: string,
  input: ContactInput,
): Promise<SaveContactResult> {
  const ubigeo = resolveUbigeo(
    await services.ubigeo.tree(),
    input.address.ubigeo,
  );
  if (!ubigeo) return { ok: false, error: "unknown_ubigeo" };

  const current = (await services.drafts.get(cartId)) ?? emptyDraft(cartId);
  const draft: CheckoutDraft = {
    ...current,
    contact: {
      customer: input.customer,
      address: {
        line: input.address.line,
        reference: input.address.reference,
        ubigeo,
      },
    },
  };
  await services.drafts.save(draft);
  return { ok: true, draft };
}
