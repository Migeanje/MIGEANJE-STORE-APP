import { randomUUID } from "node:crypto";
import type { CartLine } from "@/modules/cart/domain/cart";
import type { ContactDetails } from "@/modules/checkout/domain/checkout-draft";
import {
  advanceOrder,
  createOrder,
  type Order,
  type OrderStatus,
} from "@/modules/orders/domain/order";

/*
 * DEMO DATA for DATA_SOURCE=mock only: three orders the tracking page can
 * open right away (documented in CLAUDE.md and hinted on the page). The
 * composition root seeds them into the in-memory repository; nothing else
 * uses them. Dates are relative to "now", so the statuses always look
 * recent. Lines are snapshots of real catalog offers (a test keeps them in
 * sync with the catalog fixtures).
 */

export const DEMO_ORDER_EMAIL = "demo@migeanje.pe";

export const DEMO_ORDER_NUMBERS = {
  importing: "MG-2026-480315",
  onTheWay: "MG-2026-275904",
  delivered: "MG-2026-913628",
} as const;

/** Each demo number with the status it is in (for the page hint). */
export const DEMO_TRACKING_ORDERS: readonly {
  number: string;
  status: OrderStatus;
}[] = [
  { number: DEMO_ORDER_NUMBERS.importing, status: "en_importacion" },
  { number: DEMO_ORDER_NUMBERS.onTheWay, status: "en_camino" },
  { number: DEMO_ORDER_NUMBERS.delivered, status: "entregado" },
];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const CUSTOMER: ContactDetails["customer"] = {
  firstName: "Lucía",
  lastName: "Demo",
  email: DEMO_ORDER_EMAIL,
  phone: "900000000",
  document: { type: "dni", number: "00000000" },
};

const IMAGE = (category: string) => ({
  src: `/mock/products/${category}.svg`,
  width: 640,
  height: 640,
});

const REVODOK_PRO_210: CartLine = {
  sku: "UGR-15534",
  quantity: 1,
  maxQuantity: 2,
  unitPrice: 19890,
  availability: { status: "backorder", leadTimeDays: { min: 15, max: 20 } },
  product: {
    name: "Revodok Pro 210 Hub USB-C 10 en 1",
    brand: "UGREEN",
    variantLabel: "",
    href: "/productos/ugreen-revodok-pro-210-10-en-1?variante=ugr-15534",
    image: IMAGE("hubs-y-docks"),
  },
};

const PRIME_CABLE_240W: CartLine = {
  sku: "ANK-A88E2-090",
  quantity: 1,
  maxQuantity: 5,
  unitPrice: 8990,
  availability: { status: "in_stock" },
  product: {
    name: "Prime Cable USB-C a USB-C 240W trenzado",
    brand: "Anker",
    variantLabel: "0.9 m",
    href: "/productos/anker-prime-cable-usb-c-240w-trenzado?variante=ank-a88e2-090",
    image: IMAGE("cables"),
  },
};

const PRIME_CHARGER_100W: CartLine = {
  sku: "ANK-A2688",
  quantity: 1,
  maxQuantity: 5,
  unitPrice: 18990,
  availability: { status: "in_stock" },
  product: {
    name: "Prime Charger 100W, 3 puertos",
    brand: "Anker",
    variantLabel: "",
    href: "/productos/anker-prime-charger-100w-3-puertos?variante=ank-a2688",
    image: IMAGE("cargadores"),
  },
};

const LIGHTNING_CABLE: CartLine = {
  sku: "UGR-60759",
  quantity: 2,
  maxQuantity: 5,
  unitPrice: 5490,
  availability: { status: "in_stock" },
  product: {
    name: "Cable USB-C a Lightning MFi trenzado",
    brand: "UGREEN",
    variantLabel: "1 m",
    href: "/productos/ugreen-cable-usb-c-a-lightning-mfi-trenzado?variante=ugr-60759",
    image: IMAGE("cables"),
  },
};

function demoOrder({
  number,
  placedAt,
  address,
  lines,
  reached,
}: {
  number: string;
  placedAt: Date;
  address: ContactDetails["address"];
  lines: CartLine[];
  /** When each later status was reached, in order. */
  reached: Date[];
}): Order {
  const order = createOrder({
    number,
    accessToken: randomUUID(),
    placedAt,
    contact: { customer: CUSTOMER, address },
    receipt: { type: "boleta" },
    lines,
    payment: { provider: "demo", chargeId: `chr_demo_${number}` },
  });
  return reached.reduce((current, at) => advanceOrder(current, at), order);
}

/**
 * The demo orders as of `now`: one importing (Arequipa, a backorder hub and
 * a cable), one on its way (Lima) and one delivered (Callao).
 */
export function demoOrders(now: Date): Order[] {
  // Whole minutes read better on the timeline.
  const minute = Math.floor(now.getTime() / 60_000) * 60_000;
  const ago = (ms: number) => new Date(minute - ms);

  const onTheWayPlaced = ago(30 * HOUR);
  const deliveredPlaced = ago(8 * DAY);

  return [
    demoOrder({
      number: DEMO_ORDER_NUMBERS.importing,
      placedAt: ago(3 * DAY),
      address: {
        line: "Calle Demo 123",
        reference: "",
        ubigeo: {
          departamento: { code: "04", name: "Arequipa" },
          provincia: { code: "0401", name: "Arequipa" },
          distrito: { code: "040103", name: "Cayma" },
        },
      },
      lines: [REVODOK_PRO_210, PRIME_CABLE_240W],
      reached: [],
    }),
    demoOrder({
      number: DEMO_ORDER_NUMBERS.onTheWay,
      placedAt: onTheWayPlaced,
      address: {
        line: "Av. Demo 456, dpto. 302",
        reference: "Frente al parque",
        ubigeo: {
          departamento: { code: "15", name: "Lima" },
          provincia: { code: "1501", name: "Lima" },
          distrito: { code: "150122", name: "Miraflores" },
        },
      },
      lines: [PRIME_CHARGER_100W],
      reached: [new Date(onTheWayPlaced.getTime() + 2 * HOUR), ago(3 * HOUR)],
    }),
    demoOrder({
      number: DEMO_ORDER_NUMBERS.delivered,
      placedAt: deliveredPlaced,
      address: {
        line: "Jr. Demo 789",
        reference: "",
        ubigeo: {
          departamento: { code: "07", name: "Callao" },
          provincia: { code: "0701", name: "Callao" },
          distrito: { code: "070102", name: "Bellavista" },
        },
      },
      lines: [LIGHTNING_CABLE],
      reached: [
        new Date(deliveredPlaced.getTime() + 3 * HOUR),
        new Date(deliveredPlaced.getTime() + DAY),
        new Date(deliveredPlaced.getTime() + DAY + 6 * HOUR),
      ],
    }),
  ];
}
