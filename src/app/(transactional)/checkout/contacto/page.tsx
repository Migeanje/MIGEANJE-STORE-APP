import type { Metadata } from "next";
import { ContactStepContainer } from "@/modules/checkout/ui/checkout-step.containers";

export const metadata: Metadata = {
  title: "Contacto y envío",
  robots: { index: false },
};

/** Checkout step 1: contact and delivery address (guest checkout). */
export default function CheckoutContactPage() {
  return <ContactStepContainer />;
}
