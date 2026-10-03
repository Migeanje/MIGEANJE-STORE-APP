import type { Metadata } from "next";
import { OrderTrackingContainer } from "@/modules/orders/ui/order-tracking.container";

export const metadata: Metadata = {
  title: "Seguimiento de pedido",
  robots: { index: false },
};

/**
 * Public order tracking: order number + the buyer's email (posted, never in
 * the URL). `?numero=` (the confirmation's link) prefills only the number.
 */
export default async function OrderTrackingPage({
  searchParams,
}: PageProps<"/pedidos/seguimiento">) {
  const { numero } = await searchParams;
  return (
    <OrderTrackingContainer
      numero={typeof numero === "string" ? numero : undefined}
    />
  );
}
