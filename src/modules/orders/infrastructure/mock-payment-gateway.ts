import { randomUUID } from "node:crypto";
import type { PaymentGateway } from "@/modules/orders/application/ports";

/**
 * Test cards of the simulated payment ("Modo demostración"). Nothing is ever
 * charged; any other card is declined so nobody types a real one by mistake.
 */
export const TEST_CARDS = {
  approved: "4111111111111111",
  declined: "4000000000000002",
} as const;

/**
 * PaymentGateway for the F1 mockups (Culqi replaces it in F4). It answers by
 * card number only and keeps nothing: no card data, no log.
 */
export function createMockPaymentGateway({
  newChargeId = () =>
    `chr_demo_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
}: {
  newChargeId?: () => string;
} = {}): PaymentGateway {
  return {
    async charge({ amount, card }) {
      if (!Number.isSafeInteger(amount) || amount < 1) {
        throw new RangeError(
          `A charge must be a positive integer of céntimos, got ${amount}`,
        );
      }
      switch (card.number) {
        case TEST_CARDS.approved:
          return { status: "approved", chargeId: newChargeId() };
        case TEST_CARDS.declined:
          return { status: "declined", reason: "card_declined" };
        default:
          return { status: "declined", reason: "not_a_test_card" };
      }
    },
  };
}
