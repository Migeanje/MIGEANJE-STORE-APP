import type { Metadata } from "next";
import { AccountOrdersContainer } from "@/modules/account/ui/account-pages.containers";
import { findCustomerOrders } from "@/modules/orders/ui/customer-orders";

export const metadata: Metadata = {
  title: "Mis pedidos",
  robots: { index: false },
};

/**
 * The orders placed with the account's email (the orders module finds
 * them).
 */
export default function AccountOrdersPage() {
  return <AccountOrdersContainer orders={findCustomerOrders} />;
}
