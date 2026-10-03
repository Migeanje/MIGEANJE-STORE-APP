import type { Metadata } from "next";
import { PaymentStepContainer } from "@/modules/checkout/ui/checkout-step.containers";
import { placeOrderAction } from "@/modules/orders/ui/actions";
import { findPendingPayment } from "@/modules/orders/ui/pending-payment";

export const metadata: Metadata = {
  title: "Pago",
  robots: { index: false },
};

/**
 * Checkout step 3: the simulated payment. The orders module places the
 * order and says whether this cart's payment already awaits confirmation
 * (the checkout's `PayAction` and `PendingPaymentLookup` extension points).
 */
export default function CheckoutPaymentPage() {
  return (
    <PaymentStepContainer
      pay={placeOrderAction}
      pendingPayment={findPendingPayment}
    />
  );
}
