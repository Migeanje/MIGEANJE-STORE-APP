import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getProduct } from "@/modules/catalog/application/get-product";
import { listRelatedProducts } from "@/modules/catalog/application/list-related-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { serializeJsonLd } from "@/shared/lib/json-ld";
import { Heading } from "@/shared/ui/atoms/heading";
import { SpecList } from "@/shared/ui/molecules/spec-list";
import { ExpertReview } from "@/shared/ui/organisms/expert-review";
import { ProductGallery } from "@/shared/ui/organisms/product-gallery";
import { ProductHeader } from "@/shared/ui/organisms/product-header";
import { ProductSection } from "@/shared/ui/organisms/product-section";
import { PurchasePanel } from "@/shared/ui/organisms/purchase-panel";
import { ScrollReveal } from "@/shared/ui/organisms/scroll-reveal";
import { VariantSelector } from "@/shared/ui/organisms/variant-selector";
import { ProductPageTemplate } from "@/shared/ui/templates/product-page";
import type { AddToCartAction } from "./add-to-cart";
import {
  brandPath,
  categoryPath,
  type SearchParamsInput,
  variantSkuParam,
} from "./catalog-url";
import { CompareToggle } from "./compare-toggle";
import { NotifyMeForm } from "./notify-me-form";
import { toProductCardProps } from "./product-card-view";
import { buildProductPageView } from "./product-page.view";
import { PurchaseForm } from "./purchase-form";

const SPECS_HEADING_ID = "especificaciones";

export type ProductPageContainerProps = {
  slug: string;
  /** The page's `searchParams`: `variante` selects the variant. */
  searchParams: SearchParamsInput;
  /**
   * The cart's "add to cart" server action (M5). The route passes it; until
   * then the button says the cart is not ready.
   */
  addToCart?: AddToCartAction;
  /**
   * The account's "Guardar en favoritos" control, composed by the route
   * (the catalog never imports the account), shown after "Comparar".
   */
  favorite?: ReactNode;
};

/**
 * Server Component: the product page. Gallery, header (brand linking to its
 * page), the variant selector (`?variante=<sku>` links), the buy box for the
 * selected variant ("Agregar al carrito", or "Avísame" when we do not sell it
 * yet), "Comparar", specs, the expert review when there is one, related
 * products and schema.org `Product` data. Unknown products answer 404.
 */
export async function ProductPageContainer({
  slug,
  searchParams,
  addToCart,
  favorite,
}: ProductPageContainerProps) {
  const repository = getCatalogRepository();
  const details = await getProduct(repository, slug);
  if (!details) notFound();
  const { product, category } = details;

  const view = buildProductPageView(details, variantSkuParam(searchParams));
  const related = await listRelatedProducts(repository, product);

  return (
    <>
      <script
        type="application/ld+json"
        // Escaped by serializeJsonLd: no "<" can close the script tag.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD needs a raw script body; the data is escaped.
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(view.jsonLd) }}
      />
      <ProductPageTemplate
        gallery={<ProductGallery images={product.images} />}
        header={
          <ProductHeader
            brand={{
              name: product.brand.name,
              href: brandPath(product.brand.slug),
            }}
            name={product.name}
            model={product.model}
            summary={product.summary}
            category={{
              name: category.name,
              href: categoryPath(category.slug),
            }}
          />
        }
        options={
          <>
            <VariantSelector groups={view.optionGroups} />
            <CompareToggle
              item={{
                slug: product.slug,
                name: product.name,
                category: { slug: category.slug, name: category.name },
              }}
            />
            {favorite}
          </>
        }
        purchase={
          <PurchasePanel
            price={view.price}
            availability={view.availability}
            note={view.purchase.kind === "buy" ? view.purchase.note : undefined}
            sku={view.variant.sku}
          >
            {view.purchase.kind === "buy" ? (
              <PurchaseForm
                sku={view.variant.sku}
                maxQuantity={view.purchase.maxQuantity}
                action={addToCart}
              />
            ) : (
              <NotifyMeForm productName={product.name} />
            )}
          </PurchasePanel>
        }
        related={
          related.products.length > 0 ? (
            <ScrollReveal>
              <ProductSection
                title="También te puede interesar"
                products={related.products.map((entry) =>
                  toProductCardProps(entry, related.category),
                )}
              />
            </ScrollReveal>
          ) : undefined
        }
      >
        {view.specs.length > 0 ? (
          <section
            aria-labelledby={SPECS_HEADING_ID}
            className="flex flex-col gap-4"
          >
            <Heading id={SPECS_HEADING_ID} level={2}>
              Especificaciones
            </Heading>
            <SpecList specs={view.specs} />
          </section>
        ) : null}
        {view.review ? <ExpertReview {...view.review} /> : null}
      </ProductPageTemplate>
    </>
  );
}
