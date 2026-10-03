import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { SiteHeader } from "@/shared/ui/organisms/site-header";
import { loadCategoryLinks } from "./category-links";

/**
 * Server Component: the site header with the catalog categories as primary
 * navigation. The cart count is 0 until the cart module exists (M5).
 */
export async function SiteHeaderContainer() {
  const categories = await loadCategoryLinks(getCatalogRepository());
  return <SiteHeader categories={categories} cartCount={0} />;
}
