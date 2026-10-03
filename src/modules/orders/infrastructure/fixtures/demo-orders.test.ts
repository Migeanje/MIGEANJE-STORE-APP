// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { getProductLookup } from "@/modules/cart/infrastructure";
import { currentStatus, orderSchema } from "@/modules/orders/domain/order";
import {
  DEMO_ORDER_EMAIL,
  DEMO_ORDER_NUMBERS,
  DEMO_TRACKING_ORDERS,
  demoOrders,
} from "./demo-orders";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-10-03T17:00:00Z");

describe("demoOrders", () => {
  it("builds three valid orders of the demo email in different states", () => {
    const orders = demoOrders(NOW);

    expect(orders.map((order) => orderSchema.parse(order))).toEqual(orders);
    expect(DEMO_ORDER_EMAIL).toBe("demo@migeanje.pe");
    expect(
      orders.map((order) => [
        order.number,
        currentStatus(order),
        order.customer.email,
      ]),
    ).toEqual([
      [DEMO_ORDER_NUMBERS.importing, "en_importacion", DEMO_ORDER_EMAIL],
      [DEMO_ORDER_NUMBERS.onTheWay, "en_camino", DEMO_ORDER_EMAIL],
      [DEMO_ORDER_NUMBERS.delivered, "entregado", DEMO_ORDER_EMAIL],
    ]);
  });

  it("lists each demo number with its current status for the page hint", () => {
    expect(
      demoOrders(NOW).map((order) => ({
        number: order.number,
        status: currentStatus(order),
      })),
    ).toEqual(DEMO_TRACKING_ORDERS);
  });

  it("dates every reached status in the past, relative to now", () => {
    for (const order of demoOrders(NOW)) {
      expect(Date.parse(order.placedAt)).toBeLessThan(NOW.getTime());
      for (const entry of order.timeline) {
        if (entry.at) {
          expect(Date.parse(entry.at)).toBeLessThanOrEqual(NOW.getTime());
        }
      }
    }
  });

  it("uses one backorder and ships to Arequipa, Lima and Callao", () => {
    const [importing, onTheWay, delivered] = demoOrders(NOW);

    expect(importing?.shipping.leadTimeDays).toEqual({ min: 15, max: 20 });
    expect(importing?.shipping.zone).toBe("rest_of_peru");
    expect(onTheWay?.shipping.zone).toBe("lima_metro");
    expect(delivered?.shipping.zone).toBe("callao");
  });

  it("gives every demo order its own secret access token", () => {
    const tokens = [...demoOrders(NOW), ...demoOrders(NOW)].map(
      (order) => order.accessToken,
    );
    expect(new Set(tokens).size).toBe(tokens.length);
  });

  it("snapshots real catalog offers (price, availability, product)", async () => {
    const products = getProductLookup();
    for (const order of demoOrders(NOW)) {
      for (const line of order.lines) {
        const offer = await products.findOffer(line.sku);
        expect(offer, line.sku).not.toBeNull();
        expect({
          unitPrice: line.unitPrice,
          availability: line.availability,
          product: line.product,
        }).toEqual({
          unitPrice: offer?.unitPrice,
          availability: offer?.availability,
          product: offer?.product,
        });
      }
    }
  });
});
