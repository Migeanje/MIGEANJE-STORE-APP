import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import type { Order, UnpaidOrder } from "@/modules/orders/domain/order";

/**
 * Port: where orders are kept (in memory for `DATA_SOURCE=mock`, Medusa
 * orders in F3).
 */
export interface OrderRepository {
  /**
   * Reserves a fresh order number for an order placed at `placedAt`: no
   * stored order has it and no other call gets it, so the order can be built
   * and checked with its final number before the card is charged.
   */
  reserveNumber(placedAt: Date): Promise<string>;
  /** Stores the order; the same order (same access token) may be saved again. */
  save(order: Order): Promise<void>;
  /** The order with this exact number, or null. */
  findByNumber(number: string): Promise<Order | null>;
}

/** What to charge, in céntimos. The card is never stored by anyone. */
export type ChargeRequest = {
  amount: number;
  currency: "PEN";
  /** Receipt email for the payment provider. */
  email: string;
  description: string;
  /**
   * The simulated payment takes the test card itself. With Culqi (F4) the
   * card is tokenized in the browser and this becomes the Culqi token.
   */
  card: PaymentCard;
};

export type DeclineReason = "card_declined" | "not_a_test_card";

export type ChargeResult =
  | { status: "approved"; chargeId: string }
  | { status: "declined"; reason: DeclineReason };

/** Port: charges a card (the demo gateway now, Culqi in F4). */
export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}

/**
 * An approved charge whose order could not be stored: someone must reconcile
 * it by hand (store the order or refund the charge) and contact the customer.
 * Never card data.
 */
export type PendingReconciliation = {
  /** The order as checked before the charge, with its reserved number. */
  order: UnpaidOrder;
  chargeId: string;
  /** What was charged, in céntimos. */
  amount: number;
  currency: "PEN";
  cartId: string;
  /** Why the order could not be stored (an error message). */
  failure: string;
  /** ISO date-time. */
  recordedAt: string;
};

/**
 * Port: approved charges whose order could not be stored (in memory for
 * `DATA_SOURCE=mock`). It only keeps a record: real idempotency (a Culqi
 * idempotency key or an order intent created before the charge) belongs to F4.
 */
export interface ReconciliationLog {
  record(entry: PendingReconciliation): Promise<void>;
  /**
   * The latest pending reconciliation of this cart, or null: its payment was
   * charged, so the cart must not be charged again.
   */
  findByCart(cartId: string): Promise<PendingReconciliation | null>;
}
