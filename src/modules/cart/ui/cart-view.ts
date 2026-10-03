import type { CartLine } from "@/modules/cart/domain/cart";
import { lineTotal, summarizeCart } from "@/modules/cart/domain/cart-summary";
import {
  availabilityLabel,
  itemCountLabel,
  productDisplayName,
  SHIPPING_NOTE,
  shippingNoteText,
} from "./cart-copy";

/** One cart line as the shared UI (CartLine, CartDrawer) shows it. */
export type CartLineView = {
  sku: string;
  name: string;
  brand: string;
  /** Undefined for products without options. */
  variantLabel: string | undefined;
  /** Name with the variant, for accessible names and messages. */
  displayName: string;
  href: string;
  image: { src: string; width: number; height: number };
  availability: { status: CartLine["availability"]["status"]; label: string };
  /** In céntimos. */
  unitPrice: number;
  /** In céntimos. */
  lineTotal: number;
  quantity: number;
  maxQuantity: number;
};

export type CartView = {
  lines: CartLineView[];
  itemCount: number;
  itemCountLabel: string;
  /** In céntimos. */
  subtotal: number;
  /** Under the subtotal: shipping, and how a backorder ships. */
  notes: string[];
};

function toLineView(line: CartLine): CartLineView {
  const { product } = line;
  return {
    sku: line.sku,
    name: product.name,
    brand: product.brand,
    variantLabel:
      product.variantLabel === "" ? undefined : product.variantLabel,
    displayName: productDisplayName(product),
    href: product.href,
    image: product.image,
    availability: {
      status: line.availability.status,
      label: availabilityLabel(line.availability),
    },
    unitPrice: line.unitPrice,
    lineTotal: lineTotal(line),
    quantity: line.quantity,
    maxQuantity: line.maxQuantity,
  };
}

/** Presentational data of the cart (drawer, page and header count). */
export function toCartView(lines: readonly CartLine[]): CartView {
  const summary = summarizeCart(lines);
  const notes: string[] = [];
  if (lines.length > 0) notes.push(SHIPPING_NOTE);
  if (summary.shippingNote && summary.leadTimeDays) {
    notes.push(shippingNoteText(summary.shippingNote, summary.leadTimeDays));
  }
  return {
    lines: lines.map(toLineView),
    itemCount: summary.itemCount,
    itemCountLabel: itemCountLabel(summary.itemCount),
    subtotal: summary.subtotal,
    notes,
  };
}

/** A change shown before the server confirms it (useOptimistic). */
export type CartChange =
  | { kind: "quantity"; sku: string; quantity: number }
  | { kind: "remove"; sku: string };

/**
 * The lines as they will be once the server accepts the change. Quantities
 * stay within 1 and the line maximum, like the server's own clamp.
 */
export function applyCartChange(
  lines: readonly CartLine[],
  change: CartChange,
): CartLine[] {
  if (change.kind === "remove") {
    return lines.filter((line) => line.sku !== change.sku);
  }
  return lines.map((line) =>
    line.sku === change.sku
      ? {
          ...line,
          quantity: Math.min(Math.max(change.quantity, 1), line.maxQuantity),
        }
      : line,
  );
}
