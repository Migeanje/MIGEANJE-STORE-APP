import { redirect } from "next/navigation";
import { CART_PATH } from "@/modules/cart/ui/cart-paths";
import {
  hasUsableReceipt,
  pendingStep,
} from "@/modules/checkout/domain/checkout-draft";
import { paymentQuote } from "@/modules/checkout/domain/payment-quote";
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
import type { PayAction, PendingPaymentLookup } from "./pay-action";
import { PaymentForm } from "./payment-form";
import { PaymentPendingNotice } from "./payment-pending-notice";
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

export type PaymentStepContainerProps = {
  /** The orders module's `placeOrderAction`. */
  pay: PayAction;
  /** The orders module's `findPendingPayment`. */
  pendingPayment: PendingPaymentLookup;
};

/**
 * Step 3: the simulated card payment. `pay` and `pendingPayment` come from
 * the orders module (the checkout never imports orders). A cart whose
 * payment was already charged and awaits confirmation gets a notice instead
 * of the card form, so it cannot be paid twice.
 */
export async function PaymentStepContainer({
  pay,
  pendingPayment,
}: PaymentStepContainerProps) {
  const checkout = await requireCheckout();
  const { draft, cart } = checkout;
  if (!draft.contact) redirect(CHECKOUT_STEP_PATHS.contact);
  if (!hasUsableReceipt(draft, { facturaEnabled: features.factura })) {
    redirect(CHECKOUT_STEP_PATHS.receipt);
  }

  const pending = await pendingPayment(cart.id);
  if (pending) {
    return (
      <CheckoutShell step="payment" summary={summaryOf(checkout)}>
        <PaymentPendingNotice reference={pending.reference} />
      </CheckoutShell>
    );
  }
  const { ubigeo } = draft.contact.address;
  const quote = paymentQuote(cart.lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  if (!quote) throw new Error("A checkout with an address has a total");

  return (
    <CheckoutShell step="payment" summary={summaryOf(checkout)}>
      <PaymentForm
        action={pay}
        initialState={initialFormState()}
        quote={quote}
        termsHref={TERMS_PATH}
      />
    </CheckoutShell>
  );
}
