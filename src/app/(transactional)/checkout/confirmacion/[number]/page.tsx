import type { Metadata } from "next";
import { OrderConfirmationContainer } from "@/modules/orders/ui/order-confirmation.container";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false },
};

/**
 * The order confirmation: right after paying (access cookie) or with the
 * order number and the buyer's email.
 */
export default async function OrderConfirmationPage({
  params,
}: PageProps<"/checkout/confirmacion/[number]">) {
  const { number } = await params;
  return <OrderConfirmationContainer number={number} />;
}
