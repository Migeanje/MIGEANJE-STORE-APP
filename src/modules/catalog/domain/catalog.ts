import * as z from "zod";
import { brandSchema } from "./brand";
import { categorySchema, specValueIssue } from "./category";
import { duplicates } from "./primitives";
import { productSchema } from "./product";

/**
 * A whole catalog: what a data source loads. Besides each entity's own
 * invariants it checks the references: unique slugs and SKUs, existing brands
 * and categories (with matching names) and spec values that fit the category
 * spec schema.
 */
export const catalogSchema = z
  .strictObject({
    categories: z.array(categorySchema),
    brands: z.array(brandSchema),
    products: z.array(productSchema),
  })
  .superRefine(({ categories, brands, products }, ctx) => {
    const issue = (message: string, path: PropertyKey[]) =>
      ctx.addIssue({ code: "custom", message, path });

    for (const slug of duplicates(
      categories.map((category) => category.slug),
    )) {
      issue(`Category slug "${slug}" is used twice`, ["categories"]);
    }
    for (const slug of duplicates(brands.map((brand) => brand.slug))) {
      issue(`Brand slug "${slug}" is used twice`, ["brands"]);
    }
    for (const slug of duplicates(products.map((product) => product.slug))) {
      issue(`Product slug "${slug}" is used twice`, ["products"]);
    }
    const skus = products.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    );
    for (const sku of duplicates(skus)) {
      issue(`SKU "${sku}" is used twice`, ["products"]);
    }

    const brandsBySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    const categoriesBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );

    products.forEach((product, index) => {
      const at = (...path: PropertyKey[]) => ["products", index, ...path];

      const brand = brandsBySlug.get(product.brand.slug);
      if (!brand) {
        issue(`Unknown brand "${product.brand.slug}"`, at("brand"));
      } else if (brand.name !== product.brand.name) {
        issue(
          `Brand "${brand.slug}" is named "${brand.name}", not "${product.brand.name}"`,
          at("brand", "name"),
        );
      }

      const category = categoriesBySlug.get(product.category.slug);
      if (!category) {
        issue(`Unknown category "${product.category.slug}"`, at("category"));
        return;
      }
      if (category.name !== product.category.name) {
        issue(
          `Category "${category.slug}" is named "${category.name}", not "${product.category.name}"`,
          at("category", "name"),
        );
      }

      const definitions = new Map(
        category.specSchema.map((definition) => [definition.key, definition]),
      );
      for (const [key, value] of Object.entries(product.specs)) {
        const definition = definitions.get(key);
        if (!definition) {
          issue(
            `Spec "${key}" is not defined for category "${category.slug}"`,
            at("specs", key),
          );
          continue;
        }
        const problem = specValueIssue(value, definition);
        if (problem) issue(`Spec "${key}": ${problem}`, at("specs", key));
      }
    });
  });

export type Catalog = z.infer<typeof catalogSchema>;

/** Parses catalog data, throwing an Error that lists every issue and its path. */
export function parseCatalog(input: unknown): Catalog {
  const result = catalogSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid catalog data:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
