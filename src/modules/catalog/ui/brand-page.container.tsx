import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrandCatalog } from "@/modules/catalog/application/get-brand-catalog";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { Button } from "@/shared/ui/atoms/button";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ProductSection } from "@/shared/ui/organisms/product-section";
import { ListingPageTemplate } from "@/shared/ui/templates/listing-page";
import { productCountLabel } from "./catalog-copy";
import { categoryHref } from "./catalog-url";
import { toProductCardProps } from "./product-card-view";

const LIST_FORMAT = new Intl.ListFormat("es", {
  style: "long",
  type: "conjunction",
});

function lowercase(text: string): string {
  return text.toLocaleLowerCase("es-PE");
}

/**
 * Server Component: the brand page. The brand is plain descriptive text (no
 * logo); its products are grouped by category, each group linking to its
 * category filtered by the brand. Unknown brands answer 404.
 */
export async function BrandPageContainer({ slug }: { slug: string }) {
  const catalog = await getBrandCatalog(getCatalogRepository(), slug);
  if (!catalog) notFound();
  const { brand, groups, total } = catalog;
  const categoryNames = LIST_FORMAT.format(
    groups.map(({ category }) => lowercase(category.name)),
  );

  return (
    <ListingPageTemplate
      eyebrow="Marca"
      title={brand.name}
      description={
        groups.length > 0
          ? `Los productos de ${brand.name} que elegimos para la tienda, agrupados por categoría: ${categoryNames}.`
          : undefined
      }
      count={productCountLabel(total)}
    >
      {groups.length === 0 ? (
        <EmptyState
          title={`Pronto tendremos productos de ${brand.name}`}
          description="Mientras tanto, explora nuestras categorías."
        >
          <Button asChild variant="secondary">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-16">
          {groups.map(({ category, products }) => (
            <ProductSection
              key={category.slug}
              title={category.name}
              products={products.map((product) =>
                toProductCardProps(product, category),
              )}
              action={{
                href: categoryHref(category, {
                  filters: { brands: [brand.slug] },
                  sort: "featured",
                  page: 1,
                }),
                label: `Ver ${lowercase(category.name)} de ${brand.name}`,
              }}
            />
          ))}
        </div>
      )}
    </ListingPageTemplate>
  );
}
