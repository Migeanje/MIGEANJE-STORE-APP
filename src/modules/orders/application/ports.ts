import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import type { Order } from "@/modules/orders/domain/order";

/**
 * Port: where orders are kept (in memory for `DATA_SOURCE=mock`, Medusa
 * orders in F3).
 */
export interface OrderRepository {
  /** A fresh order number for an order placed at `placedAt`, not used yet. */
  nextNumber(placedAt: Date): Promise<string>;
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
