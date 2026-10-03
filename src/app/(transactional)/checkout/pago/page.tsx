import type { Metadata } from "next";
import { PaymentStepContainer } from "@/modules/checkout/ui/checkout-step.containers";
import { placeOrderAction } from "@/modules/orders/ui/actions";

export const metadata: Metadata = {
  title: "Pago",
  robots: { index: false },
};

/**
 * Checkout step 3: the simulated payment. The orders module places the
 * order (the checkout's `PayAction` extension point).
 */
export default function CheckoutPaymentPage() {
  return <PaymentStepContainer pay={placeOrderAction} />;
}
