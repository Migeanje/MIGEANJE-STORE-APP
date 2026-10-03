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
import { checkoutTotals } from "@/modules/checkout/domain/checkout-totals";
import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import { createOrder, type Order } from "@/modules/orders/domain/order";
import type { DeclineReason, OrderRepository, PaymentGateway } from "./ports";

export type PlaceOrderServices = {
  orders: OrderRepository;
  payments: PaymentGateway;
  products: ProductLookup;
  carts: CartRepository;
  now?: () => Date;
  newAccessToken?: () => string;
};

export type PlaceOrderInput = {
  cart: Cart | null;
  draft: CheckoutDraft | null;
  card: PaymentCard;
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
  | { kind: "unavailable"; sku: string; product: CartLineProduct };

export type PlaceOrderError =
  | { code: "empty_cart" }
  | { code: "incomplete_checkout"; step: "contact" | "receipt" }
  | { code: "cart_changed"; changes: CartChange[] }
  | { code: "payment_declined"; reason: DeclineReason };

export type PlaceOrderResult =
  | { ok: true; order: Order }
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

/**
 * Pays and creates the order of a guest checkout:
 * 1. the cart must have lines and the draft must be complete (contact, a
 *    receipt the store can issue now, the same cart);
 * 2. every line is re-priced through the catalog: when a price, availability
 *    or allowed quantity changed, the refreshed cart is saved and nothing is
 *    charged (the customer reviews the new total first);
 * 3. the total (subtotal + shipping, in céntimos) is charged once;
 * 4. on approval the order is stored and the cart emptied. A declined card
 *    leaves the cart and the draft as they were.
 * The card is only handed to the payment gateway, never stored.
 */
export async function placeOrder(
  services: PlaceOrderServices,
  { cart, draft, card, facturaEnabled }: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const now = services.now ?? (() => new Date());
  const newAccessToken = services.newAccessToken ?? (() => crypto.randomUUID());

  if (!cart || cart.lines.length === 0) {
    return { ok: false, error: { code: "empty_cart" } };
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
  const totals = checkoutTotals(lines, {
    departamento: ubigeo.departamento.code,
    provincia: ubigeo.provincia.code,
  });
  if (totals.total === null) {
    throw new Error("A complete checkout always has a shipping quote");
  }

  const placedAt = now();
  const number = await services.orders.nextNumber(placedAt);
  const charge = await services.payments.charge({
    amount: totals.total,
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

  const order = createOrder({
    number,
    accessToken: newAccessToken(),
    placedAt,
    contact,
    receipt,
    lines,
    payment: { provider: "demo", chargeId: charge.chargeId },
  });
  await services.orders.save(order);
  await clearCart(services.carts, cart.id);
  return { ok: true, order };
}
