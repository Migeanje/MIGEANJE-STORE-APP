import * as z from "zod";

/** URL segment: lowercase kebab-case, e.g. "hubs-y-docks". */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a lowercase kebab-case slug");

/** Identifier for specs and variant options: camelCase, e.g. "maxPower". */
export const keySchema = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9]*$/, "Expected a camelCase key");

/** Non-blank text, trimmed. */
export const textSchema = z.string().trim().min(1);

/** Returns the values that appear more than once, in first-seen order. */
export function duplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const repeated = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}
