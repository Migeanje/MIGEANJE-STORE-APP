import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { SiteFooter } from "@/shared/ui/organisms/site-footer";
import { loadCategoryLinks } from "./category-links";

/** Server Component: the site footer with the catalog categories under "Tienda". */
export async function SiteFooterContainer() {
  const categories = await loadCategoryLinks(getCatalogRepository());
  return <SiteFooter categories={categories} />;
}
