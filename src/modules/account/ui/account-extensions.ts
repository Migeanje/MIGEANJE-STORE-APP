import type { ProductCardProps } from "@/shared/ui/molecules/product-card";

/*
 * Extension points of the account pages. The account module never imports
 * the orders or the catalog: the /cuenta routes pass their functions in
 * (`findCustomerOrders` from orders, `findProductCards` from the catalog),
 * which match these shapes.
 */

/** One order in "Mis pedidos". */
export type AccountOrderSummary = {
  number: string;
  placedOn: { label: string; dateTime: string };
  /** Current status, e.g. "En camino". */
  status: string;
  /** In céntimos. */
  total: number;
  itemCountLabel: string;
  trackingHref: string;
  detailHref: string;
};

/**
 * The orders placed with an email the account owns, newest first. Only
 * called with the signed-in account's email.
 */
export type AccountOrdersLookup = (
  email: string,
) => Promise<readonly AccountOrderSummary[]>;

/** A favorite product as a listing card. */
export type FavoriteProductCard = { slug: string; card: ProductCardProps };

/** Cards of these products, in the same order; unknown slugs are skipped. */
export type FavoriteProductsLookup = (
  slugs: readonly string[],
) => Promise<readonly FavoriteProductCard[]>;
