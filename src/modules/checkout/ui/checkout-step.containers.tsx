import { redirect } from "next/navigation";
import { CART_PATH } from "@/modules/cart/ui/cart-paths";
import {
  hasUsableReceipt,
  pendingStep,
} from "@/modules/checkout/domain/checkout-draft";
import { checkoutTotals } from "@/modules/checkout/domain/checkout-totals";
import { getUbigeoDirectory } from "@/modules/checkout/infrastructure";
import { features } from "@/shared/config/features";
import { saveContactAction, saveReceiptAction } from "./actions";
import { DOCUMENT_TYPE_LABELS } from "./checkout-copy";
import { type CheckoutData, loadCheckout } from "./checkout-data";
import { initialFormState } from "./checkout-forms";
import { CHECKOUT_STEP_PATHS, TERMS_PATH } from "./checkout-paths";
import { CheckoutShell } from "./checkout-shell";
import {
  contactFormDefaults,
  orderSummaryView,
  receiptFormDefaults,
} from "./checkout-view";
import { ContactForm } from "./contact-form";
import type { PayAction } from "./pay-action";
import { PaymentForm } from "./payment-form";
import { ReceiptForm } from "./receipt-form";

/*
 * Server Components of the checkout steps. Each one reads the cart and the
 * draft, sends the customer back when a previous step is missing (an empty
 * cart goes to /carrito) and renders the step inside the checkout shell.
 */

async function requireCheckout(): Promise<CheckoutData> {
  const checkout = await loadCheckout();
  if (!checkout) redirect(CART_PATH);
  return checkout;
}

function summaryOf({ cart, draft }: CheckoutData) {
  return orderSummaryView(cart.lines, draft.contact?.address.ubigeo ?? null);
}

/** /checkout: to the first step still to do. */
export async function redirectToPendingStep(): Promise<never> {
  const checkout = await requireCheckout();
  redirect(
    CHECKOUT_STEP_PATHS[
      pendingStep(checkout.draft, { facturaEnabled: features.factura })
    ],
  );
}

/** Step 1: contact and delivery address. */
export async function ContactStepContainer() {
  const checkout = await requireCheckout();
  const ubigeo = await getUbigeoDirectory().tree();
  return (
    <CheckoutShell step="contact" summary={summaryOf(checkout)}>
      <ContactForm
        action={saveContactAction}
        initialState={initialFormState(
          contactFormDefaults(checkout.draft.contact),
        )}
        ubigeo={ubigeo}
      />
    </CheckoutShell>
  );
}

/** Step 2: the comprobante (boleta; factura behind the flag). */
export async function ReceiptStepContainer() {
  const checkout = await requireCheckout();
  const { contact, receipt } = checkout.draft;
  if (!contact) redirect(CHECKOUT_STEP_PATHS.contact);
  const { customer } = contact;
  return (
    <CheckoutShell step="receipt" summary={summaryOf(checkout)}>
      <ReceiptForm
        action={saveReceiptAction}
        initialState={initialFormState(receiptFormDefaults(receipt))}
        facturaEnabled={features.factura}
        boletaFor={{
          name: `${customer.firstName} ${customer.lastName}`,
          document: `${DOCUMENT_TYPE_LABELS[customer.document.type]} ${customer.document.number}`,
          email: customer.email,
        }}
      />
    </CheckoutShell>
  );
}

/**
 * Step 3: the simulated card payment. `pay` is the orders module's
 * `placeOrderAction` (the checkout never imports orders).
 */
export async function PaymentStepContainer({ pay }: { pay: PayAction }) {
  const checkout = await requireCheckout();
  const { draft, cart } = checkout;
  if (!draft.contact) redirect(CHECKOUT_STEP_PATHS.contact);
  if (!hasUsableReceipt(draft, { facturaEnabled: features.factura })) {
    redirect(CHECKOUT_STEP_PATHS.receipt);
  }
  const { ubigeo } = draft.contact.address;
  const { total } = checkoutTotals(cart.lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  if (total === null) throw new Error("A checkout with an address has a total");

  return (
    <CheckoutShell step="payment" summary={summaryOf(checkout)}>
      <PaymentForm
        action={pay}
        initialState={initialFormState()}
        total={total}
        termsHref={TERMS_PATH}
      />
    </CheckoutShell>
  );
}
