import type { Metadata } from "next";
import { FavoriteToggleContainer } from "@/modules/account/ui/favorite-toggle.container";
import { addToCartAction } from "@/modules/cart/ui/actions";
import {
  productMetadata,
  productStaticParams,
} from "@/modules/catalog/ui/catalog-routes";
import { productPath } from "@/modules/catalog/ui/catalog-url";
import { ProductPageContainer } from "@/modules/catalog/ui/product-page.container";

// Every product slug is known at build time; anything else is a 404. The
// page reads `?variante`, so it renders per request (like the category page).
export function generateStaticParams() {
  return productStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return productMetadata(slug);
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/productos/[slug]">) {
  const { slug } = await params;
  return (
    <ProductPageContainer
      slug={slug}
      searchParams={await searchParams}
      addToCart={addToCartAction}
      favorite={
        <FavoriteToggleContainer slug={slug} returnTo={productPath(slug)} />
      }
    />
  );
}
