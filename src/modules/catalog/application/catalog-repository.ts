import type { Brand } from "@/modules/catalog/domain/brand";
import type { Category } from "@/modules/catalog/domain/category";
import type { Product } from "@/modules/catalog/domain/product";
import type {
  ProductPage,
  ProductQuery,
} from "@/modules/catalog/domain/product-query";

/**
 * Port: where catalog data comes from. Adapters live in `infrastructure/`
 * (`*.mock.ts` today, `*.medusa.ts` in F3); use cases and UI only see this
 * interface, so switching `DATA_SOURCE` never touches them.
 */
export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  listBrands(): Promise<Brand[]>;
  /**
   * Products matching the query: category, brand, filters (see
   * `filterProducts`), sort ("featured" by default) and pagination (one page
   * with everything when omitted).
   */
  listProducts(query?: ProductQuery): Promise<ProductPage>;
  getProductBySlug(slug: string): Promise<Product | null>;
  /** In the requested order; unknown slugs are skipped. */
  getProductsBySlugs(slugs: readonly string[]): Promise<Product[]>;
  /** Case- and accent-insensitive text search (see `matchesSearch`). */
  searchProducts(text: string): Promise<Product[]>;
}
