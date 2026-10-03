/*
 * Shipping rules (DRAFT: mock values until the ubigeo-shipping module in F3).
 * The zone comes from the address ubigeo; the cost is a flat rate per zone in
 * céntimos; the delivery estimate is the courier's transit time plus, for an
 * order with backorder lines, the latest lead time (the order ships complete).
 */

export const SHIPPING_ZONES = ["lima_metro", "callao", "rest_of_peru"] as const;
export type ShippingZone = (typeof SHIPPING_ZONES)[number];

export type DayRange = { min: number; max: number };

/** Lima Metropolitana is the provincia of Lima (departamento 15). */
export const LIMA_METRO_PROVINCIA = "1501";
/** The Callao departamento (Provincia Constitucional del Callao). */
export const CALLAO_DEPARTAMENTO = "07";

/** Cost in céntimos and transit time in business days, per zone. DRAFT. */
export const SHIPPING_RATES: Record<
  ShippingZone,
  { cost: number; transitDays: DayRange }
> = {
  // S/ 10.00, 24–48 h.
  lima_metro: { cost: 1000, transitDays: { min: 1, max: 2 } },
  // S/ 12.00, 24–48 h.
  callao: { cost: 1200, transitDays: { min: 1, max: 2 } },
  // S/ 20.00, 3–5 business days.
  rest_of_peru: { cost: 2000, transitDays: { min: 3, max: 5 } },
};

export type ShippingQuote = {
  zone: ShippingZone;
  /** In céntimos. */
  cost: number;
  /** The courier's time, in business days. */
  transitDays: DayRange;
  /** The latest backorder's lead time, or null without backorders. */
  leadTimeDays: DayRange | null;
  /** Transit plus lead time: when the order arrives, in business days. */
  deliveryDays: DayRange;
};

/** The zone of an address, from its departamento and provincia codes. */
export function shippingZone(ubigeo: {
  departamento: string;
  provincia: string;
}): ShippingZone {
  if (ubigeo.provincia === LIMA_METRO_PROVINCIA) return "lima_metro";
  if (ubigeo.departamento === CALLAO_DEPARTAMENTO) return "callao";
  return "rest_of_peru";
}

/** What shipping costs and when the order arrives. */
export function quoteShipping(
  ubigeo: { departamento: string; provincia: string },
  leadTimeDays: DayRange | null,
): ShippingQuote {
  const zone = shippingZone(ubigeo);
  const { cost, transitDays } = SHIPPING_RATES[zone];
  return {
    zone,
    cost,
    transitDays: { ...transitDays },
    leadTimeDays: leadTimeDays ? { ...leadTimeDays } : null,
    deliveryDays: {
      min: transitDays.min + (leadTimeDays?.min ?? 0),
      max: transitDays.max + (leadTimeDays?.max ?? 0),
    },
  };
}
