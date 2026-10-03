// Route data for the discovery pages: static params and metadata. Server
// only (it reads the composition root); the routes in src/app delegate here.
import type { Metadata } from "next";
import { normalizeSearchQuery } from "@/modules/catalog/application/search-products";
import { getCatalogRepository } from "@/modules/catalog/infrastructure";
import { productCountLabel, searchTitle } from "./catalog-copy";
import {
  brandPath,
  categoryPath,
  productPath,
  type SearchParamsInput,
  searchQueryParam,
} from "./catalog-url";

function description(name: string, total: number): string {
  return `${name} en Migeanje Store: ${productCountLabel(total)} elegidos con criterio, con precios en soles.`;
}

/** Every category, prerendered at build time. */
export async function categoryStaticParams(): Promise<{ slug: string }[]> {
  const categories = await getCatalogRepository().listCategories();
  return categories.map(({ slug }) => ({ slug }));
}

/**
 * Title, description and canonical URL (filters and sort are left out of
 * it) of a category page; empty for an unknown slug, which answers 404.
 */
export async function categoryMetadata(slug: string): Promise<Metadata> {
  const repository = getCatalogRepository();
  const category = (await repository.listCategories()).find(
    (entry) => entry.slug === slug,
  );
  if (!category) return {};
  const { total } = await repository.listProducts({ categorySlug: slug });
  return {
    title: category.name,
    description: description(category.name, total),
    alternates: { canonical: categoryPath(slug) },
  };
}

/** Every brand, prerendered at build time. */
export async function brandStaticParams(): Promise<{ slug: string }[]> {
  const brands = await getCatalogRepository().listBrands();
  return brands.map(({ slug }) => ({ slug }));
}

/** Title, description and canonical URL of a brand page; empty when unknown. */
export async function brandMetadata(slug: string): Promise<Metadata> {
  const repository = getCatalogRepository();
  const brand = (await repository.listBrands()).find(
    (entry) => entry.slug === slug,
  );
  if (!brand) return {};
  const { total } = await repository.listProducts({ brandSlug: slug });
  return {
    title: brand.name,
    description: description(brand.name, total),
    alternates: { canonical: brandPath(slug) },
  };
}

/** The search page echoes the query in its title; results are not indexed. */
export function searchMetadata(searchParams: SearchParamsInput): Metadata {
  return {
    title: searchTitle(normalizeSearchQuery(searchQueryParam(searchParams))),
    robots: { index: false },
  };
}

/** Every product, prerendered at build time (see the product page route). */
export async function productStaticParams(): Promise<{ slug: string }[]> {
  const { items } = await getCatalogRepository().listProducts();
  return items.map(({ slug }) => ({ slug }));
}

/**
 * Title ("Anker Prime Charger 100W, 3 puertos"), description (the summary)
 * and canonical URL (the bare product path: variants share it) of a product
 * page; empty for an unknown slug, which answers 404.
 */
export async function productMetadata(slug: string): Promise<Metadata> {
  const product = await getCatalogRepository().getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.brand.name} ${product.name}`,
    description: product.summary,
    alternates: { canonical: productPath(slug) },
  };
}

/** The comparator depends on its query: never indexed. */
export const compareMetadata: Metadata = {
  title: "Comparar productos",
  robots: { index: false },
};
