// The shipping rates as customers read them on /envios-y-devoluciones: the
// same rates the checkout charges (`SHIPPING_RATES`), so the page never
// drifts from the price at "Pagar".
import {
  SHIPPING_RATES,
  SHIPPING_ZONES,
  type ShippingZone,
} from "@/modules/checkout/domain/shipping";
import { formatPEN } from "@/shared/lib/money";
import { transitText } from "./checkout-copy";

export const SHIPPING_ZONE_NAMES: Record<ShippingZone, string> = {
  lima_metro: "Lima Metropolitana",
  callao: "Callao",
  rest_of_peru: "Resto del Perú",
};

export type ShippingRateRow = {
  zone: ShippingZone;
  name: string;
  /** Formatted with `formatPEN`. */
  price: string;
  /** The courier's time, e.g. "3–5 días hábiles". */
  time: string;
};

/** One row per shipping zone, in zone order. DRAFT rates. */
export function shippingRateRows(): ShippingRateRow[] {
  return SHIPPING_ZONES.map((zone) => {
    const { cost, transitDays } = SHIPPING_RATES[zone];
    return {
      zone,
      name: SHIPPING_ZONE_NAMES[zone],
      price: formatPEN(cost),
      time: transitText(zone, transitDays),
    };
  });
}
