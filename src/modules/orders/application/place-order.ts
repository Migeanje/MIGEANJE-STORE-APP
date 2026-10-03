import { clearCart } from "@/modules/cart/application/clear-cart";
import type {
  CartRepository,
  ProductLookup,
} from "@/modules/cart/application/ports";
import {
  type Cart,
  type CartLineProduct,
  deleteLine,
  type LineAvailability,
  type OfferAvailability,
  setLineQuantity,
} from "@/modules/cart/domain/cart";
import {
  type CheckoutDraft,
  hasUsableReceipt,
} from "@/modules/checkout/domain/checkout-draft";
import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import {
  type PaymentQuote,
  paymentQuote,
  samePaymentQuote,
} from "@/modules/checkout/domain/payment-quote";
import {
  type Order,
  payOrder,
  prepareOrder,
  type UnpaidOrder,
} from "@/modules/orders/domain/order";
import type {
  DeclineReason,
  OrderRepository,
  PaymentGateway,
  ReconciliationLog,
} from "./ports";

export type PlaceOrderServices = {
  orders: OrderRepository;
  payments: PaymentGateway;
  products: ProductLookup;
  carts: CartRepository;
  reconciliations: ReconciliationLog;
  now?: () => Date;
  newAccessToken?: () => string;
};

export type PlaceOrderInput = {
  cart: Cart | null;
  draft: CheckoutDraft | null;
  card: PaymentCard;
  /**
   * The total and fingerprint the payment page showed ("Pagar S/ X"), as
   * posted by the form; null when it sent none. Only compared, never charged.
   */
  expected: PaymentQuote | null;
  facturaEnabled: boolean;
};

/** Something in the cart is not what the customer saw: review before paying. */
export type CartChange =
  | {
      kind: "price";
      sku: string;
      product: CartLineProduct;
      from: number;
      to: number;
    }
  | {
      kind: "availability";
      sku: string;
      product: CartLineProduct;
      from: LineAvailability;
      to: LineAvailability;
    }
  | {
      kind: "quantity";
      sku: string;
      product: CartLineProduct;
      from: number;
      to: number;
    }
  | { kind: "unavailable"; sku: string; product: CartLineProduct }
  | {
      /**
       * The cart or its shipping is not what the payment page showed (e.g. it
       * changed in another tab): `from` is the total the page showed (null
       * when it sent none), `to` the total to pay now.
       */
      kind: "quote";
      from: number | null;
      to: number;
    };

export type PlaceOrderError =
  | { code: "empty_cart" }
  | { code: "incomplete_checkout"; step: "contact" | "receipt" }
  | { code: "cart_changed"; changes: CartChange[] }
  | { code: "payment_declined"; reason: DeclineReason }
  | {
      /**
       * An earlier payment of this cart was charged but its order could not
       * be stored: it awaits reconciliation, so this cart is never charged
       * again (nothing was charged now). `orderNumber` is the reference the
       * customer got.
       */
      code: "payment_pending_reconciliation";
      orderNumber: string;
    }
  | {
      /**
       * The card WAS charged but the order could not be stored. Never invite
       * a retry: the charge is kept for reconciliation (`recorded` says
       * whether the record was written) and the customer is contacted.
       */
      code: "order_persist_failed_after_charge";
      orderNumber: string;
      chargeId: string;
      amount: number;
      /** Why it failed (an error message, for the server log). */
      failure: string;
      recorded: boolean;
    };

export type PlaceOrderResult =
  | {
      ok: true;
      order: Order;
      /**
       * False when the order was stored but emptying the cart failed: the
       * order stands (the cart is a lesser problem than a second charge).
       */
      cartCleared: boolean;
    }
  | { ok: false; error: PlaceOrderError };

function sameAvailability(a: OfferAvailability, b: OfferAvailability) {
  if (a.status !== b.status) return false;
  if (a.status !== "backorder" || b.status !== "backorder") return true;
  return (
    a.leadTimeDays.min === b.leadTimeDays.min &&
    a.leadTimeDays.max === b.leadTimeDays.max
  );
}

/**
 * Refreshes every line from the catalog (price, availability, limit). Lines
 * no longer sold are removed. Returns the refreshed cart and what changed.
 */
async function repriceCart(
  cart: Cart,
  products: ProductLookup,
): Promise<{ cart: Cart; changes: CartChange[] }> {
  let next = cart;
  const changes: CartChange[] = [];

  for (const line of cart.lines) {
    const { sku, product } = line;
    const offer = await products.findOffer(sku);
    const refreshed = offer
      ? setLineQuantity(next, offer, line.quantity)
      : null;
    if (!refreshed?.ok) {
      next = deleteLine(next, sku).cart;
      changes.push({ kind: "unavailable", sku, product });
      continue;
    }

    const updated = refreshed.line;
    if (updated.unitPrice !== line.unitPrice) {
      changes.push({
        kind: "price",
        sku,
        product,
        from: line.unitPrice,
        to: updated.unitPrice,
      });
    }
    if (!sameAvailability(updated.availability, line.availability)) {
      changes.push({
        kind: "availability",
        sku,
        product,
        from: line.availability,
        to: updated.availability,
      });
    }
    if (updated.quantity !== line.quantity) {
      changes.push({
        kind: "quantity",
        sku,
        product,
        from: line.quantity,
        to: updated.quantity,
      });
    }
    next = refreshed.cart;
  }
  return { cart: next, changes };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/**
 * Pays and creates the order of a guest checkout:
 * 1. the cart must have lines, must not have a charged payment awaiting
 *    reconciliation (`payment_pending_reconciliation`: never a second
 *    charge for the same cart) and the draft must be complete (contact, a
 *    receipt the store can issue now, the same cart);
 * 2. every line is re-priced through the catalog: when a price, availability
 *    or allowed quantity changed, the refreshed cart is saved and nothing is
 *    charged (the customer reviews the new total first);
 * 3. the cart must still be what the payment page showed (`expected`: total
 *    and fingerprint); otherwise nothing is charged (e.g. it changed in
 *    another tab). The posted total is compared, never charged;
 * 4. the order is built and checked with a reserved number BEFORE charging,
 *    so a bad order or a taken number never fails after the customer paid;
 * 5. the order total (subtotal + shipping, in céntimos) is charged once;
 * 6. on approval the order is stored with that number and the cart emptied.
 *    A declined card leaves the cart and the draft as they were. When the
 *    order cannot be stored after an approved charge, the charge is recorded
 *    for reconciliation and the answer says so (never "try again"); when only
 *    emptying the cart fails, the order stands.
 * Anything thrown before step 5 means nothing was charged. The card is only
 * handed to the payment gateway, never stored.
 */
export async function placeOrder(
  services: PlaceOrderServices,
  { cart, draft, card, expected, facturaEnabled }: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const now = services.now ?? (() => new Date());
  const newAccessToken = services.newAccessToken ?? (() => crypto.randomUUID());

  if (!cart || cart.lines.length === 0) {
    return { ok: false, error: { code: "empty_cart" } };
  }
  const pending = await services.reconciliations.findByCart(cart.id);
  if (pending) {
    return {
      ok: false,
      error: {
        code: "payment_pending_reconciliation",
        orderNumber: pending.order.number,
      },
    };
  }
  if (!draft?.contact || draft.cartId !== cart.id) {
    return {
      ok: false,
      error: { code: "incomplete_checkout", step: "contact" },
    };
  }
  if (!draft.receipt || !hasUsableReceipt(draft, { facturaEnabled })) {
    return {
      ok: false,
      error: { code: "incomplete_checkout", step: "receipt" },
    };
  }
  const { contact, receipt } = draft;

  const repriced = await repriceCart(cart, services.products);
  if (repriced.changes.length > 0) {
    await services.carts.save(repriced.cart);
    return {
      ok: false,
      error: { code: "cart_changed", changes: repriced.changes },
    };
  }
  const { lines } = repriced.cart;

  const { ubigeo } = contact.address;
  const quote = paymentQuote(lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  if (!quote) {
    throw new Error("A complete checkout always has a shipping quote");
  }
  if (!expected || !samePaymentQuote(expected, quote)) {
    return {
      ok: false,
      error: {
        code: "cart_changed",
        changes: [
          { kind: "quote", from: expected?.total ?? null, to: quote.total },
        ],
      },
    };
  }

  const placedAt = now();
  const number = await services.orders.reserveNumber(placedAt);
  const prepared = prepareOrder({
    number,
    accessToken: newAccessToken(),
    placedAt,
    contact,
    receipt,
    lines,
  });
  const amount = prepared.totals.total;
  if (amount !== quote.total) {
    throw new Error("The order total must be the quoted total");
  }

  const charge = await services.payments.charge({
    amount,
    currency: "PEN",
    email: contact.customer.email,
    description: `Migeanje Store · pedido ${number}`,
    card,
  });
  if (charge.status === "declined") {
    return {
      ok: false,
      error: { code: "payment_declined", reason: charge.reason },
    };
  }

  // From here on the customer has paid: no exception may escape.
  let order: Order;
  try {
    order = payOrder(prepared, { provider: "demo", chargeId: charge.chargeId });
    await services.orders.save(order);
  } catch (error) {
    return {
      ok: false,
      error: await keepForReconciliation(services, {
        order: prepared,
        chargeId: charge.chargeId,
        amount,
        cartId: cart.id,
        failure: messageOf(error),
        at: now(),
      }),
    };
  }

  try {
    await clearCart(services.carts, cart.id);
    return { ok: true, order, cartCleared: true };
  } catch {
    return { ok: true, order, cartCleared: false };
  }
}

/** Records an approved charge whose order could not be stored. Never throws. */
async function keepForReconciliation(
  services: PlaceOrderServices,
  entry: {
    order: UnpaidOrder;
    chargeId: string;
    amount: number;
    cartId: string;
    failure: string;
    at: Date;
  },
): Promise<
  Extract<PlaceOrderError, { code: "order_persist_failed_after_charge" }>
> {
  const { order, chargeId, amount, cartId, failure, at } = entry;
  let recorded = true;
  try {
    await services.reconciliations.record({
      order,
      chargeId,
      amount,
      currency: "PEN",
      cartId,
      failure,
      recordedAt: at.toISOString(),
    });
  } catch {
    recorded = false;
  }
  return {
    code: "order_persist_failed_after_charge",
    orderNumber: order.number,
    chargeId,
    amount,
    failure,
    recorded,
  };
}
