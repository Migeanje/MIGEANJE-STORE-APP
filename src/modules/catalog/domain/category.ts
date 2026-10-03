import * as z from "zod";
import { duplicates, keySchema, slugSchema, textSchema } from "./primitives";

export const SPEC_KINDS = ["number", "text", "boolean", "list"] as const;

/** One spec a category's products can have, e.g. "Potencia máxima" in W. */
export const specDefinitionSchema = z.strictObject({
  key: keySchema,
  /** Customer-facing label, unique within the category. */
  label: textSchema,
  /** Unit after number values, e.g. "W" or "mAh". */
  unit: textSchema.optional(),
  kind: z.enum(SPEC_KINDS),
  /** Offered as a facet on the category page. */
  filterable: z.boolean(),
  /** Shown as a row in the comparator. */
  comparable: z.boolean(),
  /** Display position; lower first. */
  order: z.int().nonnegative(),
});

export const categorySchema = z
  .strictObject({
    slug: slugSchema,
    name: textSchema,
    specSchema: z.array(specDefinitionSchema).min(1),
  })
  .superRefine(({ specSchema }, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message, path: ["specSchema"] });

    for (const key of duplicates(specSchema.map((spec) => spec.key))) {
      issue(`Spec key "${key}" is defined twice`);
    }
    for (const label of duplicates(specSchema.map((spec) => spec.label))) {
      issue(`Spec label "${label}" is defined twice`);
    }
    for (const order of duplicates(specSchema.map((spec) => spec.order))) {
      issue(`Spec order ${order} is used twice`);
    }
    for (const spec of specSchema) {
      if (spec.unit !== undefined && spec.kind !== "number") {
        issue(`Spec "${spec.key}" has a unit but is not a number`);
      }
    }
  });

export type SpecKind = (typeof SPEC_KINDS)[number];
export type SpecDefinition = z.infer<typeof specDefinitionSchema>;
export type Category = z.infer<typeof categorySchema>;

/** How a product points at its category: no spec schema copied per product. */
export const categoryRefSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema,
});

export type CategoryRef = z.infer<typeof categoryRefSchema>;

export function categoryRef({ slug, name }: Category): CategoryRef {
  return { slug, name };
}

/**
 * Raw spec values, keyed by spec key. The category's spec schema decides the
 * kind of each value (see `specValueIssue`); a product may omit any spec.
 */
export const specValueSchema = z.union([
  z.number(),
  z.string(),
  z.boolean(),
  z.array(z.string()),
]);

export type SpecValue = z.infer<typeof specValueSchema>;
export type SpecValues = Record<string, SpecValue>;

/** Returns why `value` does not fit the definition's kind, or null if it fits. */
export function specValueIssue(
  value: unknown,
  definition: SpecDefinition,
): string | null {
  const got = `got ${JSON.stringify(value)}`;
  switch (definition.kind) {
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : `Expected a finite number, ${got}`;
    case "text":
      return typeof value === "string" && value.trim() !== ""
        ? null
        : `Expected non-blank text, ${got}`;
    case "boolean":
      return typeof value === "boolean" ? null : `Expected a boolean, ${got}`;
    case "list": {
      const valid =
        Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => typeof item === "string" && item.trim() !== "") &&
        duplicates(value).length === 0;
      return valid
        ? null
        : `Expected a list of distinct non-blank texts, ${got}`;
    }
  }
}

/** The category's spec definitions sorted by `order` (a new array). */
export function orderedSpecs(category: Category): SpecDefinition[] {
  return [...category.specSchema].sort((a, b) => a.order - b.order);
}

export type ResolvedSpec = SpecDefinition & { value: SpecValue };

/** The product's present spec values with their definitions, in display order. */
export function resolveSpecs(
  specs: SpecValues,
  category: Category,
): ResolvedSpec[] {
  return orderedSpecs(category).flatMap((definition) => {
    const value = specs[definition.key];
    return value === undefined ? [] : [{ ...definition, value }];
  });
}
