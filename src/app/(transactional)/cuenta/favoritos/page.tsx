import type { Metadata } from "next";
import { FavoritesPageContainer } from "@/modules/account/ui/account-pages.containers";
import { findProductCards } from "@/modules/catalog/ui/product-cards";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false },
};

/**
 * The saved products as catalog cards (the catalog renders them).
 */
export default async function FavoritesPage({
  searchParams,
}: PageProps<"/cuenta/favoritos">) {
  return (
    <FavoritesPageContainer
      searchParams={await searchParams}
      products={findProductCards}
    />
  );
}
