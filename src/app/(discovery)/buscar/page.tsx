import type { Metadata } from "next";
import { searchMetadata } from "@/modules/catalog/ui/catalog-routes";
import { SearchPageContainer } from "@/modules/catalog/ui/search-page.container";

export async function generateMetadata({
  searchParams,
}: PageProps<"/buscar">): Promise<Metadata> {
  return searchMetadata(await searchParams);
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/buscar">) {
  return <SearchPageContainer searchParams={await searchParams} />;
}
