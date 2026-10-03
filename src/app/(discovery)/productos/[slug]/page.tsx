import type { Metadata } from "next";
import {
  productMetadata,
  productStaticParams,
} from "@/modules/catalog/ui/catalog-routes";
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
  // M5: pass the cart's server action here as `addToCart`.
  return <ProductPageContainer slug={slug} searchParams={await searchParams} />;
}
