import type { Metadata } from "next";
import { ReceiptStepContainer } from "@/modules/checkout/ui/checkout-step.containers";

export const metadata: Metadata = {
  title: "Comprobante",
  robots: { index: false },
};

/** Checkout step 2: boleta (factura behind the `factura` flag). */
export default function CheckoutReceiptPage() {
  return <ReceiptStepContainer />;
}
