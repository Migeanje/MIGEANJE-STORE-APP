import { availabilityLabel } from "@/modules/cart/ui/cart-copy";
import type { IdentityDocument } from "@/modules/checkout/domain/customer";
import type { Receipt } from "@/modules/checkout/domain/receipt";
import {
  shippingLabel,
  TAX_NOTE,
  transitText,
} from "@/modules/checkout/ui/checkout-copy";
import type { Order, OrderLine } from "@/modules/orders/domain/order";
import type { OrderSummaryLine } from "@/shared/ui/organisms/order-summary";
import type { OrderConfirmationProps } from "@/shared/ui/templates/order-confirmation";
import { backorderNoteText, nextSteps } from "./order-copy";
import { orderTrackingHref } from "./order-paths";

const DATE_PARTS = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  // Delivery dates are calendar dates (already in Lima): no shifting.
  timeZone: "UTC",
});

/** "lunes 5 de octubre" for "2026-10-05". */
export function dateText(date: string): string {
  const parts = DATE_PARTS.formatToParts(new Date(`${date}T00:00:00Z`));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} de ${part("month")}`;
}

/** "Llega el lunes 5 de octubre" or "Llega entre el … y el …". */
export function deliveryDateText({
  from,
  to,
}: {
  from: string;
  to: string;
}): string {
  return from === to
    ? `Llega el ${dateText(from)}`
    : `Llega entre el ${dateText(from)} y el ${dateText(to)}`;
}

const DOCUMENT_LABELS = { dni: "DNI", ce: "CE" } as const;

/** "Boleta de venta electrónica · DNI 46027897" or the factura's RUC. */
export function receiptText(
  receipt: Receipt,
  document: IdentityDocument,
): string {
  return receipt.type === "factura"
    ? `Factura electrónica · RUC ${receipt.ruc} · ${receipt.businessName}`
    : `Boleta de venta electrónica · ${DOCUMENT_LABELS[document.type]} ${document.number}`;
}

function rangeText({ min, max }: { min: number; max: number }): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

/** "Envío a Lima Metropolitana" or "Envío a Arequipa". */
export function orderShippingLabel(order: Order): string {
  return shippingLabel(
    order.shipping.zone,
    order.shippingAddress.ubigeo.departamento.name,
  );
}

/** "Envío a Arequipa · 18–25 días hábiles (15–20 de importación)". */
export function deliveryDetailText(order: Order): string {
  const { shipping } = order;
  const time = shipping.leadTimeDays
    ? `${rangeText(shipping.deliveryDays)} días hábiles (${rangeText(shipping.leadTimeDays)} de importación)`
    : transitText(shipping.zone, shipping.transitDays);
  return `${orderShippingLabel(order)} · ${time}`;
}

type SummaryLineAvailability = OrderSummaryLine["availability"];

function availabilityAtPurchase(line: OrderLine): SummaryLineAvailability {
  return {
    status: line.availability.status,
    label: availabilityLabel(line.availability),
  };
}

/**
 * The order summary (lines, totals in céntimos, notes) of a paid order.
 * Lines show their availability at purchase unless `lineAvailability`
 * answers something else for a line.
 */
export function orderSummaryView(
  order: Order,
  lineAvailability?: (line: OrderLine) => SummaryLineAvailability | undefined,
): OrderConfirmationProps["summary"] {
  return {
    lines: order.lines.map((line) => ({
      key: line.sku,
      name: line.product.name,
      variantLabel:
        line.product.variantLabel === ""
          ? undefined
          : line.product.variantLabel,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      availability: lineAvailability?.(line) ?? availabilityAtPurchase(line),
    })),
    subtotal: order.totals.subtotal,
    shipping: order.totals.shipping,
    shippingLabel: orderShippingLabel(order),
    total: order.totals.total,
    notes: [TAX_NOTE],
  };
}

/** Everything the confirmation page shows about a paid order. */
export function orderConfirmationView(order: Order): OrderConfirmationProps {
  const { shipping, shippingAddress: address } = order;
  const { departamento, provincia, distrito } = address.ubigeo;

  return {
    orderNumber: order.number,
    email: order.customer.email,
    delivery: {
      title: deliveryDateText(order.estimatedDelivery),
      detail: deliveryDetailText(order),
    },
    backorderNote: shipping.leadTimeDays
      ? backorderNoteText(shipping.leadTimeDays)
      : undefined,
    receipt: receiptText(order.receipt, order.customer.document),
    shippingAddress: [
      address.line,
      ...(address.reference ? [`Referencia: ${address.reference}`] : []),
      `${distrito.name}, ${provincia.name}, ${departamento.name}`,
    ],
    nextSteps: nextSteps(shipping.leadTimeDays !== null),
    summary: orderSummaryView(order),
    trackingHref: orderTrackingHref(order.number),
    continueHref: "/",
  };
}
