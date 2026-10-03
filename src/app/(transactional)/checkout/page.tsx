import { redirectToPendingStep } from "@/modules/checkout/ui/checkout-step.containers";

/** /checkout ("Ir a pagar"): to the first step still to do, or to /carrito. */
export default async function CheckoutPage() {
  return redirectToPendingStep();
}
