import type { Metadata } from "next";
import { AccountDashboardContainer } from "@/modules/account/ui/account-pages.containers";
import { findCustomerOrders } from "@/modules/orders/ui/customer-orders";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

/**
 * The account's start page: greeting, recent orders (the orders module
 * finds them) and quick links.
 */
export default async function AccountHomePage({
  searchParams,
}: PageProps<"/cuenta">) {
  return (
    <AccountDashboardContainer
      searchParams={await searchParams}
      orders={findCustomerOrders}
    />
  );
}
