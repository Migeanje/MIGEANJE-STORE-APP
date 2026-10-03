import * as z from "zod";
import {
  type CartLine,
  cartLineProductSchema,
  leadTimeDaysSchema,
  lineAvailabilitySchema,
  moneySchema,
  skuSchema,
} from "@/modules/cart/domain/cart";
import { lineTotal } from "@/modules/cart/domain/cart-summary";
import {
  type ContactDetails,
  shippingAddressSchema,
} from "@/modules/checkout/domain/checkout-draft";
import { checkoutTotals } from "@/modules/checkout/domain/checkout-totals";
import { customerSchema } from "@/modules/checkout/domain/customer";
import { deliveryWindow, limaDate } from "@/modules/checkout/domain/delivery";
import { type Receipt, receiptSchema } from "@/modules/checkout/domain/receipt";
import { SHIPPING_ZONES } from "@/modules/checkout/domain/shipping";

/*
 * An order: what was bought (a snapshot of the cart lines and their prices),
 * by whom, where it goes, the comprobante, the totals in céntimos and its
 * status timeline. Card data is never part of it: only the payment
 * reference. The number is public (receipts, tracking) and is looked up
 * together with the buyer's email; the access token is a secret for the
 * confirmation page right after paying.
 */

/** "MG-2026-000123": store prefix, year in Lima, 6 digits. */
export const ORDER_NUMBER_PATTERN = /^MG-\d{4}-\d{6}$/;
export const orderNumberSchema = z
  .string()
  .regex(ORDER_NUMBER_PATTERN, "Expected an order number like MG-2026-000123");

/**
 * Order statuses in the order customers see them. `en_importacion` only
 * applies to orders with backorder lines.
 */
export const ORDER_STATUSES = [
  "pagado",
  "en_importacion",
  "preparando",
  "en_camino",
  "entregado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const dateSchema = z.iso.date();
const dayRangeSchema = z
  .strictObject({ min: z.int().min(0), max: z.int().min(0) })
  .refine((range) => range.min <= range.max, {
    message: "min must not be above max",
  });

export const orderLineSchema = z
  .strictObject({
    sku: skuSchema,
    quantity: z.int().min(1),
    /** Price of one unit in céntimos when the order was paid. */
    unitPrice: moneySchema,
    lineTotal: moneySchema,
    availability: lineAvailabilitySchema,
    product: cartLineProductSchema,
  })
  .refine((line) => line.lineTotal === line.unitPrice * line.quantity, {
    message: "lineTotal must be unitPrice × quantity",
    path: ["lineTotal"],
  });

export const timelineEntrySchema = z.strictObject({
  status: z.enum(ORDER_STATUSES),
  /** When the order reached this status; null while it has not. */
  at: z.iso.datetime().nullable(),
});

type TimelineShape = readonly { status: OrderStatus; at: string | null }[];

/** Every status in ORDER_STATUSES order (`en_importacion` only with backorder). */
function hasExpectedStatuses(
  timeline: TimelineShape,
  hasBackorder: boolean,
): boolean {
  const expected = ORDER_STATUSES.filter(
    (status) => status !== "en_importacion" || hasBackorder,
  );
  return (
    timeline.length === expected.length &&
    timeline.every((entry, index) => entry.status === expected[index])
  );
}

/** Reached statuses come first (at least `pagado`), with dates never going back. */
function isProgressive(timeline: TimelineShape): boolean {
  const reached = timeline.filter((entry) => entry.at !== null);
  if (reached.length === 0) return false;
  const prefix = timeline.slice(0, reached.length);
  if (prefix.some((entry) => entry.at === null)) return false;
  const times = reached.map((entry) => Date.parse(entry.at as string));
  return times.every((time, index) => index === 0 || time >= times[index - 1]);
}

export const orderSchema = z
  .strictObject({
    number: orderNumberSchema,
    accessToken: z.uuid(),
    placedAt: z.iso.datetime(),
    customer: customerSchema,
    receipt: receiptSchema,
    shippingAddress: shippingAddressSchema,
    lines: z.array(orderLineSchema).min(1),
    /** In céntimos; prices include taxes (no IGV breakdown under Nuevo RUS). */
    totals: z.strictObject({
      subtotal: moneySchema,
      shipping: moneySchema,
      total: moneySchema,
    }),
    shipping: z.strictObject({
      zone: z.enum(SHIPPING_ZONES),
      transitDays: dayRangeSchema,
      leadTimeDays: leadTimeDaysSchema.nullable(),
      deliveryDays: dayRangeSchema,
    }),
    /** First and last delivery dates (Lima calendar). */
    estimatedDelivery: z.strictObject({ from: dateSchema, to: dateSchema }),
    timeline: z.array(timelineEntrySchema).min(1),
    payment: z.strictObject({
      provider: z.literal("demo"),
      chargeId: z.string().min(1),
    }),
  })
  .refine(
    (order) =>
      order.totals.subtotal ===
      order.lines.reduce((sum, line) => sum + line.lineTotal, 0),
    { message: "subtotal must be the sum of the lines", path: ["totals"] },
  )
  .refine(
    (order) =>
      order.totals.total === order.totals.subtotal + order.totals.shipping,
    { message: "total must be subtotal + shipping", path: ["totals"] },
  )
  .refine(
    (order) =>
      hasExpectedStatuses(
        order.timeline,
        order.lines.some((line) => line.availability.status === "backorder"),
      ),
    {
      message:
        "timeline must list every status in order, with en_importacion only for backorder orders",
      path: ["timeline"],
    },
  )
  .refine((order) => isProgressive(order.timeline), {
    message:
      "timeline must reach pagado first and every later status in order, with dates never going back",
    path: ["timeline"],
  });

export type OrderLine = z.infer<typeof orderLineSchema>;
export type TimelineEntry = z.infer<typeof timelineEntrySchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderPayment = Order["payment"];

/**
 * "MG-<year>-<sequence with 6 digits>". Throws a RangeError for a year that
 * is not 4 digits or a sequence outside 0–999999.
 */
export function formatOrderNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError(`An order year must have 4 digits, got ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 999_999) {
    throw new RangeError(
      `An order sequence must be an integer from 0 to 999999, got ${sequence}`,
    );
  }
  return `MG-${year}-${String(sequence).padStart(6, "0")}`;
}

const TYPED_ORDER_NUMBER = /^MG-?(\d{4})-?(\d{6})$/;

/**
 * What a customer types, without spaces and uppercased; spaces or missing
 * dashes between the parts are fine ("mg 2026 000123", "MG2026000123").
 * Anything else stays invalid ("mg-2026-1" -> "MG-2026-1").
 */
export function normalizeOrderNumber(input: string): string {
  const compact = input.replace(/\s+/g, "").toUpperCase();
  const parts = TYPED_ORDER_NUMBER.exec(compact);
  return parts ? `MG-${parts[1]}-${parts[2]}` : compact;
}

/**
 * The statuses of a new, paid order. With backorder lines the import starts
 * right after payment, so `en_importacion` is reached at placement too.
 */
export function initialTimeline({
  hasBackorder,
  placedAt,
}: {
  hasBackorder: boolean;
  placedAt: Date;
}): TimelineEntry[] {
  const at = placedAt.toISOString();
  return ORDER_STATUSES.filter(
    (status) => status !== "en_importacion" || hasBackorder,
  ).map((status) => ({
    status,
    at: status === "pagado" || status === "en_importacion" ? at : null,
  }));
}

/** The latest status the order reached. */
export function currentStatus(order: Pick<Order, "timeline">): OrderStatus {
  const reached = order.timeline.filter((entry) => entry.at !== null);
  const latest = reached.at(-1);
  if (!latest) throw new Error("An order always reaches at least one status");
  return latest.status;
}

/**
 * The order with its next status reached at `at` (e.g. the warehouse starts
 * preparing it). Throws for a delivered order, and a RangeError for a time
 * before the status it is in now. The input is not changed.
 */
export function advanceOrder(order: Order, at: Date): Order {
  const next = order.timeline.findIndex((entry) => entry.at === null);
  if (next === -1) {
    throw new Error(`Order ${order.number} is already delivered`);
  }
  const last = order.timeline[next - 1]?.at;
  if (last && at.getTime() < Date.parse(last)) {
    throw new RangeError(
      `Order ${order.number} cannot reach a status before ${last}, got ${at.toISOString()}`,
    );
  }
  return orderSchema.parse({
    ...order,
    timeline: order.timeline.map((entry, index) =>
      index === next ? { ...entry, at: at.toISOString() } : entry,
    ),
  });
}

export type NewOrder = {
  number: string;
  accessToken: string;
  placedAt: Date;
  contact: ContactDetails;
  receipt: Receipt;
  /** The cart lines, already re-priced against the catalog. */
  lines: readonly CartLine[];
  payment: OrderPayment;
};

/**
 * A paid order from the checkout data: snapshots the lines, prices totals and
 * shipping with `checkoutTotals` (the same rule as the checkout summary) and
 * dates the delivery from the Lima calendar. Throws when the result is not a
 * valid order (e.g. no lines).
 */
export function createOrder(input: NewOrder): Order {
  const { ubigeo } = input.contact.address;
  const totals = checkoutTotals(input.lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  const shipping = totals.shipping;
  if (!shipping || totals.total === null) {
    throw new Error("An order needs a shipping quote");
  }

  return orderSchema.parse({
    number: input.number,
    accessToken: input.accessToken,
    placedAt: input.placedAt.toISOString(),
    customer: input.contact.customer,
    receipt: input.receipt,
    shippingAddress: input.contact.address,
    lines: input.lines.map((line) => ({
      sku: line.sku,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: lineTotal(line),
      availability: line.availability,
      product: line.product,
    })),
    totals: {
      subtotal: totals.subtotal,
      shipping: shipping.cost,
      total: totals.total,
    },
    shipping: {
      zone: shipping.zone,
      transitDays: shipping.transitDays,
      leadTimeDays: shipping.leadTimeDays,
      deliveryDays: shipping.deliveryDays,
    },
    estimatedDelivery: deliveryWindow(input.placedAt, shipping.deliveryDays),
    timeline: initialTimeline({
      hasBackorder: totals.leadTimeDays !== null,
      placedAt: input.placedAt,
    }),
    payment: input.payment,
  });
}

/** An order checked before payment: everything but the payment reference. */
export type UnpaidOrder = Omit<Order, "payment">;

// Stands in for the payment reference while an order is checked before the
// charge; `payOrder` replaces it, so it is never stored.
const PAYMENT_PENDING: OrderPayment = { provider: "demo", chargeId: "pending" };

/**
 * Builds and checks the whole order (number, lines, totals, shipping,
 * timeline) BEFORE charging, so nothing that can be known in advance fails
 * after the customer paid. Throws like `createOrder`.
 */
export function prepareOrder(input: Omit<NewOrder, "payment">): UnpaidOrder {
  const { payment: _pending, ...order } = createOrder({
    ...input,
    payment: PAYMENT_PENDING,
  });
  return order;
}

/** The prepared order with the reference of its approved charge. */
export function payOrder(order: UnpaidOrder, payment: OrderPayment): Order {
  return orderSchema.parse({ ...order, payment });
}

/** The year an order placed at `placedAt` is numbered with (Lima calendar). */
export function orderYear(placedAt: Date): number {
  return Number(limaDate(placedAt).slice(0, 4));
}
