import type { Metadata } from "next";
import { BrandPageContainer } from "@/modules/catalog/ui/brand-page.container";
import {
  brandMetadata,
  brandStaticParams,
} from "@/modules/catalog/ui/catalog-routes";

export function generateStaticParams() {
  return brandStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/marcas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return brandMetadata(slug);
}

export default async function BrandPage({
  params,
}: PageProps<"/marcas/[slug]">) {
  const { slug } = await params;
  return <BrandPageContainer slug={slug} />;
}
