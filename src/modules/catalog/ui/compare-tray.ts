import * as z from "zod";
import { MAX_COMPARED } from "@/modules/catalog/application/compare-products";
import { slugSchema, textSchema } from "@/modules/catalog/domain/primitives";

/*
 * The compare tray: the products a visitor picked to compare, kept per
 * browser (see compare-tray-store.ts). Pure functions on plain data; at most
 * MAX_COMPARED products, all of one category, in the order they were added.
 */

const categorySchema = z.object({ slug: slugSchema, name: textSchema });

const compareItemSchema = z.object({
  slug: slugSchema,
  name: textSchema,
  category: categorySchema,
});

export type CompareItem = z.infer<typeof compareItemSchema>;
export type CompareTrayCategory = CompareItem["category"];
export type CompareTray = { items: readonly CompareItem[] };

export const EMPTY_TRAY: CompareTray = Object.freeze({
  items: Object.freeze([]),
});

export type AddToTrayResult =
  | { status: "added" | "already_added" | "full"; tray: CompareTray }
  /** The tray holds another category: ask before replacing it. */
  | {
      status: "other_category";
      tray: CompareTray;
      current: CompareTrayCategory;
    };

/** The category of the products in the tray, or null when it is empty. */
export function trayCategory(tray: CompareTray): CompareTrayCategory | null {
  return tray.items[0]?.category ?? null;
}

/** Adds a product at the end, unless it is there, the tray is full or of another category. */
export function addToTray(
  tray: CompareTray,
  item: CompareItem,
): AddToTrayResult {
  if (tray.items.some(({ slug }) => slug === item.slug)) {
    return { status: "already_added", tray };
  }
  const current = trayCategory(tray);
  if (current !== null && current.slug !== item.category.slug) {
    return { status: "other_category", tray, current };
  }
  if (tray.items.length >= MAX_COMPARED) return { status: "full", tray };
  return { status: "added", tray: { items: [...tray.items, item] } };
}

export function removeFromTray(tray: CompareTray, slug: string): CompareTray {
  return { items: tray.items.filter((item) => item.slug !== slug) };
}

/** A new tray with only this product (after the visitor agreed to replace). */
export function replaceTray(item: CompareItem): CompareTray {
  return { items: [item] };
}

export function serializeTray(tray: CompareTray): string {
  return JSON.stringify({ items: tray.items });
}

/**
 * Reads a saved tray. Anything unreadable is an empty tray; invalid entries,
 * repeated products, products of another category than the first and
 * anything past the limit are dropped.
 */
export function parseTray(raw: string | null): CompareTray {
  if (raw === null || raw === "") return EMPTY_TRAY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_TRAY;
  }
  const parsed = z.object({ items: z.array(z.unknown()) }).safeParse(data);
  if (!parsed.success) return EMPTY_TRAY;

  let tray = EMPTY_TRAY;
  for (const entry of parsed.data.items) {
    const item = compareItemSchema.safeParse(entry);
    if (item.success) tray = addToTray(tray, item.data).tray;
  }
  return tray;
}
