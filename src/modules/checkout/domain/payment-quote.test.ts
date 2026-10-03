// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aBackorderOffer, aLine } from "@/modules/cart/testing/cart-builders";
import {
  PAYMENT_QUOTE_FINGERPRINT_PATTERN,
  paymentQuote,
  samePaymentQuote,
} from "./payment-quote";

const LIMA = { departamento: "15", provincia: "1501" };
const CALLAO = { departamento: "07", provincia: "0701" };

describe("paymentQuote", () => {
  it("quotes the checkout total with a fingerprint of what decides it", () => {
    const quote = paymentQuote([aLine({ quantity: 2 })], LIMA);

    // 2 × S/ 189.90 + S/ 10.00 to Lima.
    expect(quote?.total).toBe(38980);
    expect(quote?.fingerprint).toMatch(PAYMENT_QUOTE_FINGERPRINT_PATTERN);
  });

  it("has no quote before the shipping address is known", () => {
    expect(paymentQuote([aLine()], null)).toBeNull();
  });

  it("gives the same cart the same fingerprint, whatever the line order", () => {
    const charger = aLine();
    const backorder = aLine({}, aBackorderOffer());
    expect(paymentQuote([charger, backorder], LIMA)).toEqual(
      paymentQuote([backorder, charger], LIMA),
    );
  });

  it("changes the fingerprint with quantities, prices, availability or shipping", () => {
    const base = paymentQuote([aLine({ quantity: 2 })], LIMA);
    const variants = [
      paymentQuote([aLine({ quantity: 3 })], LIMA),
      paymentQuote([aLine({ quantity: 2, unitPrice: 19990 })], LIMA),
      paymentQuote(
        [
          aLine({
            quantity: 2,
            availability: {
              status: "backorder",
              leadTimeDays: { min: 15, max: 20 },
            },
          }),
        ],
        LIMA,
      ),
      paymentQuote([aLine({ quantity: 2 })], CALLAO),
    ];
    for (const variant of variants) {
      expect(variant?.fingerprint).not.toBe(base?.fingerprint);
    }
  });
});

describe("samePaymentQuote", () => {
  const quote = { total: 38980, fingerprint: "1a2b3c4d" };

  it("needs the same total and the same fingerprint", () => {
    expect(samePaymentQuote(quote, { ...quote })).toBe(true);
    expect(samePaymentQuote(quote, { ...quote, total: 38981 })).toBe(false);
    expect(samePaymentQuote(quote, { ...quote, fingerprint: "1a2b3c4e" })).toBe(
      false,
    );
  });
});
