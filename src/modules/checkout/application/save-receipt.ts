import type { CheckoutDraft } from "@/modules/checkout/domain/checkout-draft";
import type { Receipt } from "@/modules/checkout/domain/receipt";
import type { CheckoutDraftRepository } from "./ports";

export type SaveReceiptResult =
  | { ok: true; draft: CheckoutDraft }
  | { ok: false; error: "factura_disabled" | "contact_missing" };

/**
 * Stores the comprobante. A factura is refused while the `factura` flag is
 * off (Nuevo RUS: boletas only); the contact step must be done first (a
 * boleta is issued to the customer's document).
 */
export async function saveReceipt(
  drafts: CheckoutDraftRepository,
  cartId: string,
  receipt: Receipt,
  { facturaEnabled }: { facturaEnabled: boolean },
): Promise<SaveReceiptResult> {
  if (receipt.type === "factura" && !facturaEnabled) {
    return { ok: false, error: "factura_disabled" };
  }
  const current = await drafts.get(cartId);
  if (!current?.contact) return { ok: false, error: "contact_missing" };

  const draft: CheckoutDraft = { ...current, receipt };
  await drafts.save(draft);
  return { ok: true, draft };
}
