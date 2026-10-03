import { limaDate } from "@/modules/checkout/domain/delivery";
import {
  currentStatus,
  type Order,
  type OrderLine,
  type OrderStatus,
  type TimelineEntry,
} from "@/modules/orders/domain/order";
import type { OrderStatusStep } from "@/shared/ui/organisms/order-status-timeline";
import type { TrackedOrder } from "@/shared/ui/templates/order-tracking";
import {
  IMPORTED_LINE_LABEL,
  importNote,
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  RECEIPT_TYPE_LABELS,
  updatesNote,
} from "./order-copy";
import {
  dateText,
  deliveryDateText,
  deliveryDetailText,
  orderShippingLabel,
  orderSummaryView,
} from "./order-view";

/*
 * What the public tracking page shows about an order. The page opens with
 * the number and the buyer's email, so it keeps personal data to a minimum:
 * first name and initial, the beginning of the street, the district, the
 * receipt type (no document numbers) and the email partly hidden.
 */

const MASK = "•••";

/** "a•••@correo.pe": the first letter of the name and the domain. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  return `${email.slice(0, 1)}${MASK}${at === -1 ? "" : email.slice(at)}`;
}

const MAX_STREET_CHARACTERS = 6;

/** "Av. La…": at most half of the street line, up to six characters. */
export function maskStreet(line: string): string {
  const shown = Math.min(MAX_STREET_CHARACTERS, Math.floor(line.length / 2));
  return `${line.slice(0, shown).trimEnd()}…`;
}

/** "Ana P.": the first name and the initial of the last name. */
export function recipientName({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}): string {
  return `${firstName} ${lastName.trim().slice(0, 1)}.`;
}

// Order times in Lima: "2 oct. 2026, 10:00 a. m.".
const TIME_FORMAT = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Lima",
});

// Calendar dates (already in Lima): "2 de octubre de 2026".
const DATE_FORMAT = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "long",
  timeZone: "UTC",
});

function placedOn(order: Order): TrackedOrder["placedOn"] {
  const date = limaDate(new Date(order.placedAt));
  return {
    label: DATE_FORMAT.format(new Date(`${date}T00:00:00Z`)),
    dateTime: date,
  };
}

function step(
  entry: TimelineEntry,
  current: OrderStatus,
  reachedCurrent: boolean,
): OrderStatusStep {
  const state =
    entry.status === current ? "current" : reachedCurrent ? "pending" : "done";
  return {
    id: entry.status,
    label: ORDER_STATUS_LABELS[entry.status],
    description: ORDER_STATUS_DESCRIPTIONS[entry.status],
    state,
    ...(entry.at && state !== "pending"
      ? {
          reachedAt: {
            label: TIME_FORMAT.format(new Date(entry.at)),
            dateTime: entry.at,
          },
        }
      : {}),
  };
}

function steps(order: Order, current: OrderStatus): OrderStatusStep[] {
  let reachedCurrent = false;
  return order.timeline.map((entry) => {
    const result = step(entry, current, reachedCurrent);
    if (entry.status === current) reachedCurrent = true;
    return result;
  });
}

const STILL_IMPORTING: readonly OrderStatus[] = ["pagado", "en_importacion"];

function delivery(
  order: Order,
  current: OrderStatus,
): TrackedOrder["delivery"] {
  const delivered = order.timeline.find(
    (entry) => entry.status === "entregado",
  )?.at;
  if (current === "entregado" && delivered) {
    return {
      title: `Entregado el ${dateText(limaDate(new Date(delivered)))}`,
      detail: orderShippingLabel(order),
    };
  }
  return {
    title: deliveryDateText(order.estimatedDelivery),
    detail: deliveryDetailText(order),
  };
}

/** Everything the public tracking page shows about an order. */
export function orderTrackingView(order: Order): TrackedOrder {
  const current = currentStatus(order);
  const importing = STILL_IMPORTING.includes(current);
  const { customer, shippingAddress: address } = order;
  const { departamento, provincia, distrito } = address.ubigeo;
  const lineAvailability = (line: OrderLine) =>
    line.availability.status === "backorder" && !importing
      ? { status: "in_stock" as const, label: IMPORTED_LINE_LABEL }
      : undefined;

  return {
    number: order.number,
    status: ORDER_STATUS_LABELS[current],
    placedOn: placedOn(order),
    steps: steps(order, current),
    updatesNote: updatesNote(maskEmail(customer.email)),
    delivery: delivery(order, current),
    importNote:
      current === "en_importacion" && order.shipping.leadTimeDays
        ? importNote(order.shipping.leadTimeDays)
        : undefined,
    recipient: recipientName(customer),
    shippingAddress: [
      maskStreet(address.line),
      `${distrito.name}, ${provincia.name}, ${departamento.name}`,
    ],
    receipt: RECEIPT_TYPE_LABELS[order.receipt.type],
    summary: orderSummaryView(order, lineAvailability),
  };
}
