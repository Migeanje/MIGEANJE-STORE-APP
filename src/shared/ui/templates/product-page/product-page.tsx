import type { ReactNode } from "react";

export type ProductPageTemplateProps = {
  /** The images (e.g. `ProductGallery`). */
  gallery: ReactNode;
  /** Brand, name (the h1), model and summary (e.g. `ProductHeader`). */
  header: ReactNode;
  /** Variant options (e.g. `VariantSelector`) and secondary actions. */
  options?: ReactNode;
  /** The buy box (e.g. `PurchasePanel`): sticky from `lg`. */
  purchase: ReactNode;
  /** Below the gallery: specs, expert review. */
  children?: ReactNode;
  /** Full width at the end: related products. */
  related?: ReactNode;
};

/**
 * Layout of the product page, mobile first: gallery, header, options, buy
 * box, details, related. From `lg`, two columns: gallery and details on the
 * left; header, options and the buy box on the right, where the buy box
 * sticks below the site header while the details scroll.
 */
export function ProductPageTemplate({
  gallery,
  header,
  options,
  purchase,
  children,
  related,
}: ProductPageTemplateProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-8 sm:px-8 lg:gap-24 lg:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:gap-y-16">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">{gallery}</div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {header}
          {options}
          <div data-slot="purchase" className="lg:sticky lg:top-32">
            {purchase}
          </div>
        </div>
        {children ? (
          <div className="flex min-w-0 flex-col gap-16 lg:col-start-1 lg:row-start-2">
            {children}
          </div>
        ) : null}
      </div>
      {related}
    </div>
  );
}
