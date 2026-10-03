// @vitest-environment node
import { describe, expect, it } from "vitest";
import { aCard } from "@/modules/orders/testing/order-builders";
import { createMockPaymentGateway, TEST_CARDS } from "./mock-payment-gateway";

const request = (number: string) => ({
  amount: 38980,
  currency: "PEN" as const,
  email: "ana@correo.pe",
  description: "Migeanje Store · pedido MG-2026-000123",
  card: aCard({ number }),
});

describe("createMockPaymentGateway", () => {
  const gateway = createMockPaymentGateway({ newChargeId: () => "chr_demo_x" });

  it("approves 4111 1111 1111 1111", async () => {
    expect(TEST_CARDS.approved).toBe("4111111111111111");
    expect(await gateway.charge(request(TEST_CARDS.approved))).toEqual({
      status: "approved",
      chargeId: "chr_demo_x",
    });
  });

  it("declines 4000 0000 0000 0002", async () => {
    expect(TEST_CARDS.declined).toBe("4000000000000002");
    expect(await gateway.charge(request(TEST_CARDS.declined))).toEqual({
      status: "declined",
      reason: "card_declined",
    });
  });

  it("declines every other card: demo mode charges test cards only", async () => {
    expect(await gateway.charge(request("5555555555554444"))).toEqual({
      status: "declined",
      reason: "not_a_test_card",
    });
  });

  it("throws for an amount that is not a positive integer of céntimos", async () => {
    await expect(
      gateway.charge({ ...request(TEST_CARDS.approved), amount: 0 }),
    ).rejects.toThrow(RangeError);
    await expect(
      gateway.charge({ ...request(TEST_CARDS.approved), amount: 10.5 }),
    ).rejects.toThrow(RangeError);
  });

  it("creates distinct charge ids by default", async () => {
    const real = createMockPaymentGateway();
    const first = await real.charge(request(TEST_CARDS.approved));
    const second = await real.charge(request(TEST_CARDS.approved));
    expect(first).toMatchObject({ status: "approved" });
    expect(first).not.toEqual(second);
  });
});
