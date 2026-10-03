import type { ReactNode } from "react";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { SiteHeader } from "@/shared/ui/organisms/site-header";
import { loadCategoryLinks } from "./category-links";

export type SiteHeaderContainerProps = {
  /**
   * The cart control, composed by the root layout from the cart module
   * (count from the cart cookie, opens the drawer). Without it the header
   * shows a plain link to /carrito with 0 items.
   */
  cart?: ReactNode;
  /**
   * The account control, composed by the root layout from the account
   * module (the signed-in first name). Without it the header shows a plain
   * "Mi cuenta" link.
   */
  account?: ReactNode;
};

/**
 * Server Component: the site header with the catalog categories as primary
 * navigation. The catalog never imports the cart or the account: their
 * controls arrive as slots.
 */
export async function SiteHeaderContainer({
  cart,
  account,
}: SiteHeaderContainerProps = {}) {
  const categories = await loadCategoryLinks(getCatalogRepository());
  return <SiteHeader categories={categories} cart={cart} account={account} />;
}
