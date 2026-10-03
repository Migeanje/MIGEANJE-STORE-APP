import { compareMetadata } from "@/modules/catalog/ui/catalog-routes";
import { ComparePageContainer } from "@/modules/catalog/ui/compare-page.container";

export const metadata = compareMetadata;

export default async function ComparePage({
  searchParams,
}: PageProps<"/comparar">) {
  return <ComparePageContainer searchParams={await searchParams} />;
}
