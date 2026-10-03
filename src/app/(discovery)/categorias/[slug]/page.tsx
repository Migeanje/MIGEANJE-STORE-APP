import type { Metadata } from "next";
import {
  categoryMetadata,
  categoryStaticParams,
} from "@/modules/catalog/ui/catalog-routes";
import { CategoryPageContainer } from "@/modules/catalog/ui/category-page.container";

export function generateStaticParams() {
  return categoryStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return categoryMetadata(slug);
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/categorias/[slug]">) {
  const { slug } = await params;
  return (
    <CategoryPageContainer slug={slug} searchParams={await searchParams} />
  );
}
