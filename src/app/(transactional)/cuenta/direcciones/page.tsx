import type { Metadata } from "next";
import { AddressesPageContainer } from "@/modules/account/ui/account-pages.containers";

export const metadata: Metadata = {
  title: "Direcciones",
  robots: { index: false },
};

/**
 * The address book (`?editar=<id>` edits an address).
 */
export default async function AddressesPage({
  searchParams,
}: PageProps<"/cuenta/direcciones">) {
  return <AddressesPageContainer searchParams={await searchParams} />;
}
