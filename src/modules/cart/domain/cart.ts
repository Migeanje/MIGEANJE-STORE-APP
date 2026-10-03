import * as z from "zod";

/*
 * The cart: one line per SKU with a snapshot of what the customer saw when
 * adding it (unit price in céntimos, availability, name and image). Snapshots
 * are refreshed from the catalog on every add and quantity change, never
 * taken from the client. All operations are pure: they return a new cart.
 */

/**
 * Most units per line: in stock we can ship a few more; a backorder is
 * imported for you, so fewer. An unavailable product cannot be added.
 */
export const MAX_LINE_QUANTITY = {
  in_stock: 5,
  backorder: 2,
} as const;

/** An amount in céntimos (S/ 129.90 is 12990): a non-negative safe integer. */
export const moneySchema = z.int().nonnegative();

export const skuSchema = z
  .string()
  .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, "Expected an uppercase SKU");

export const cartIdSchema = z.uuid();

/** Business days until a backorder arrives, e.g. { min: 15, max: 20 }. */
export const leadTimeDaysSchema = z
  .strictObject({ min: z.int().min(1), max: z.int().min(1) })
  .refine((lead) => lead.min <= lead.max, {
    message: "leadTimeDays.min must not be above max",
    path: ["max"],
  });

/** What a line can be: only products you can buy get into the cart. */
export const lineAvailabilitySchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("in_stock") }),
  z.strictObject({
    status: z.literal("backorder"),
    leadTimeDays: leadTimeDaysSchema,
  }),
]);

/** Display snapshot of the product behind a line. */
export const cartLineProductSchema = z.strictObject({
  /** Model name without the brand, e.g. "Nano Charger 45W Smart Display". */
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  /** The variant's option values ("Blanco", "Negro · 2 m"); empty without options. */
  variantLabel: z.string().trim(),
  /** Where to see the product (site path). */
  href: z.string().regex(/^\/\S*$/, "Expected a site path"),
  image: z.strictObject({
    src: z
      .string()
      .regex(/^(\/|https:\/\/)\S+$/, "Expected a site path or an https URL"),
    width: z.int().positive(),
    height: z.int().positive(),
  }),
});

export const cartLineSchema = z
  .strictObject({
    sku: skuSchema,
    quantity: z.int().min(1),
    /** Most units allowed for this line when it was last refreshed. */
    maxQuantity: z.int().min(1),
    /** Price of one unit in céntimos when the line was last refreshed. */
    unitPrice: moneySchema,
    availability: lineAvailabilitySchema,
    product: cartLineProductSchema,
  })
  .refine((line) => line.quantity <= line.maxQuantity, {
    message: "quantity must not be above maxQuantity",
    path: ["quantity"],
  })
  .refine(
    (line) => line.maxQuantity <= MAX_LINE_QUANTITY[line.availability.status],
    {
      message: "maxQuantity must not be above the limit for its availability",
      path: ["maxQuantity"],
    },
  );

/** The persisted shape of a cart (what a repository stores). */
export const cartSchema = z
  .strictObject({
    id: cartIdSchema,
    lines: z.array(cartLineSchema),
  })
  .refine(
    (cart) =>
      new Set(cart.lines.map((line) => line.sku)).size === cart.lines.length,
    { message: "A SKU must appear in one line only", path: ["lines"] },
  );

export type LineAvailability = z.infer<typeof lineAvailabilitySchema>;
export type CartLineProduct = z.infer<typeof cartLineProductSchema>;
export type CartLine = z.infer<typeof cartLineSchema>;
export type Cart = z.infer<typeof cartSchema>;

/** Availability as the catalog reports it, including products we cannot sell. */
export type OfferAvailability = LineAvailability | { status: "unavailable" };

/** What the catalog says about a SKU right now (see the ProductLookup port). */
export type CartOffer = {
  sku: string;
  unitPrice: number;
  availability: OfferAvailability;
  /** Units left to sell, when the catalog knows it. Lowers the line limit. */
  stockLimit?: number;
  product: CartLineProduct;
};

export type QuantityLimitReason =
  | "in_stock_limit"
  | "backorder_limit"
  | "stock_limit";

export type QuantityLimit = { max: number; reason: QuantityLimitReason };

/** A request above the limit was lowered to `limit.max`. */
export type QuantityClamp = { requested: number; limit: QuantityLimit };

function assertQuantity(quantity: number): void {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new RangeError(
      `A cart quantity must be a positive integer, got ${quantity}`,
    );
  }
}

/**
 * Most units of one line: 5 in stock, 2 on backorder, or less when the
 * catalog knows a smaller stock. Throws a RangeError for a stock limit that
 * is not a positive integer (an adapter reports no stock as unavailable).
 */
export function quantityLimit(
  availability: LineAvailability,
  stockLimit?: number,
): QuantityLimit {
  const rule = MAX_LINE_QUANTITY[availability.status];
  const reason =
    availability.status === "in_stock" ? "in_stock_limit" : "backorder_limit";
  if (stockLimit === undefined) return { max: rule, reason };
  if (!Number.isSafeInteger(stockLimit) || stockLimit < 1) {
    throw new RangeError(
      `A stock limit must be a positive integer, got ${stockLimit}`,
    );
  }
  return stockLimit < rule
    ? { max: stockLimit, reason: "stock_limit" }
    : { max: rule, reason };
}

/** A new cart without lines. Throws when the id is not a UUID. */
export function emptyCart(id: string): Cart {
  return { id: cartIdSchema.parse(id), lines: [] };
}

function toLine(
  offer: CartOffer & { availability: LineAvailability },
  quantity: number,
  limit: QuantityLimit,
): CartLine {
  return {
    sku: offer.sku,
    quantity,
    maxQuantity: limit.max,
    unitPrice: offer.unitPrice,
    availability: offer.availability,
    product: offer.product,
  };
}

function isPurchasable(
  offer: CartOffer,
): offer is CartOffer & { availability: LineAvailability } {
  return offer.availability.status !== "unavailable";
}

function replaceLine(cart: Cart, line: CartLine): Cart {
  return {
    ...cart,
    lines: cart.lines.map((current) =>
      current.sku === line.sku ? line : current,
    ),
  };
}

export type AddLineResult =
  | {
      ok: true;
      cart: Cart;
      line: CartLine;
      /** Units actually added (less than requested when clamped). */
      added: number;
      clamped: QuantityClamp | null;
    }
  | { ok: false; reason: "unavailable" }
  | {
      ok: false;
      reason: "limit_reached";
      limit: QuantityLimit;
      /** The line that already has the most units allowed. */
      line: CartLine;
    };

/**
 * Adds units of the offer: a SKU already in the cart grows its line (with a
 * refreshed snapshot), a new one is appended. Above the limit the line is
 * clamped and the result says why; with the line already at the limit nothing
 * changes. Throws a RangeError for a quantity that is not a positive integer.
 */
export function addLine(
  cart: Cart,
  offer: CartOffer,
  quantity: number,
): AddLineResult {
  assertQuantity(quantity);
  if (!isPurchasable(offer)) return { ok: false, reason: "unavailable" };

  const limit = quantityLimit(offer.availability, offer.stockLimit);
  const existing = cart.lines.find((line) => line.sku === offer.sku);
  const current = existing?.quantity ?? 0;
  if (existing && current >= limit.max) {
    return { ok: false, reason: "limit_reached", limit, line: existing };
  }

  const requested = current + quantity;
  const applied = Math.min(requested, limit.max);
  const line = toLine(offer, applied, limit);
  return {
    ok: true,
    cart: existing
      ? replaceLine(cart, line)
      : { ...cart, lines: [...cart.lines, line] },
    line,
    added: applied - current,
    clamped: applied < requested ? { requested, limit } : null,
  };
}

export type SetLineQuantityResult =
  | { ok: true; cart: Cart; line: CartLine; clamped: QuantityClamp | null }
  | { ok: false; reason: "not_in_cart" | "unavailable" };

/**
 * Sets the units of a line already in the cart and refreshes its snapshot,
 * clamped to the limit of the current availability. Throws a RangeError for
 * a quantity that is not a positive integer (removing is `deleteLine`).
 */
export function setLineQuantity(
  cart: Cart,
  offer: CartOffer,
  quantity: number,
): SetLineQuantityResult {
  assertQuantity(quantity);
  if (!cart.lines.some((line) => line.sku === offer.sku)) {
    return { ok: false, reason: "not_in_cart" };
  }
  if (!isPurchasable(offer)) return { ok: false, reason: "unavailable" };

  const limit = quantityLimit(offer.availability, offer.stockLimit);
  const applied = Math.min(quantity, limit.max);
  const line = toLine(offer, applied, limit);
  return {
    ok: true,
    cart: replaceLine(cart, line),
    line,
    clamped: applied < quantity ? { requested: quantity, limit } : null,
  };
}

/** Removes the line of a SKU; `removed` is null when it was not there. */
export function deleteLine(
  cart: Cart,
  sku: string,
): { cart: Cart; removed: CartLine | null } {
  const removed = cart.lines.find((line) => line.sku === sku) ?? null;
  if (!removed) return { cart, removed };
  return {
    cart: { ...cart, lines: cart.lines.filter((line) => line.sku !== sku) },
    removed,
  };
}

/** The same cart without lines. */
export function clearLines(cart: Cart): Cart {
  return { ...cart, lines: [] };
}
