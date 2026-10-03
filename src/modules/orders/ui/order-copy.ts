// Customer-facing copy of orders (neutral Peruvian Spanish, "tú").
// DRAFT: every text here is pending owner review.
import type { LineAvailability } from "@/modules/cart/domain/cart";
import { leadTimeLabel, productDisplayName } from "@/modules/cart/ui/cart-copy";
import type { CartChange } from "@/modules/orders/application/place-order";
import type { DeclineReason } from "@/modules/orders/application/ports";
import type { OrderStatus } from "@/modules/orders/domain/order";
import { formatPEN } from "@/shared/lib/money";

/** Status names for the confirmation and tracking (M7). */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pagado: "Pagado",
  en_importacion: "En importación",
  preparando: "Preparando tu pedido",
  en_camino: "En camino",
  entregado: "Entregado",
};

export const PAYMENT_FAILED_TITLE = "No pudimos procesar el pago";

export const PAYMENT_FAILURE = {
  title: PAYMENT_FAILED_TITLE,
  message:
    "Algo salió mal de nuestro lado. Espera un momento e inténtalo de nuevo.",
};

export const ORDER_NOT_FOUND_MESSAGE =
  "No encontramos un pedido con ese número y correo.";

export function declinedError(reason: DeclineReason): {
  title: string;
  message: string;
} {
  switch (reason) {
    case "card_declined":
      return {
        title: PAYMENT_FAILED_TITLE,
        message:
          "Tu banco rechazó la tarjeta. Prueba con otra tarjeta o comunícate con tu banco. No se hizo ningún cargo.",
      };
    case "not_a_test_card":
      return {
        title: PAYMENT_FAILED_TITLE,
        message:
          "En el modo demostración solo funcionan las tarjetas de prueba: usa 4111 1111 1111 1111 para aprobar el pago. No se hizo ningún cargo.",
      };
  }
}

function availabilityChange(to: LineAvailability, from: LineAvailability) {
  if (to.status === "in_stock") return "ahora está en stock";
  return from.status === "in_stock"
    ? `ahora está en importación y llega en ${leadTimeLabel(to.leadTimeDays)}`
    : `ahora llega en ${leadTimeLabel(to.leadTimeDays)}`;
}

/** One sentence per change, e.g. "X: ahora cuesta S/ 189.90 (antes S/ 150.00)." */
export function cartChangeText(change: CartChange): string {
  const name = productDisplayName(change.product);
  switch (change.kind) {
    case "price":
      return `${name}: ahora cuesta ${formatPEN(change.to)} (antes ${formatPEN(change.from)}).`;
    case "availability":
      return `${name}: ${availabilityChange(change.to, change.from)}.`;
    case "quantity":
      return `${name}: ahora puedes llevar hasta ${change.to} ${change.to === 1 ? "unidad" : "unidades"}; ajustamos la cantidad.`;
    case "unavailable":
      return `${name}: se agotó y lo quitamos de tu carrito.`;
  }
}

export function cartChangedError(changes: readonly CartChange[]) {
  return {
    title: "Tu carrito cambió",
    message:
      "Actualizamos tu pedido con los precios y la disponibilidad de hoy. Revisa el nuevo total antes de pagar: no se hizo ningún cargo.",
    details: changes.map(cartChangeText),
  };
}

/** What happens after paying, in order. */
export function nextSteps(hasBackorder: boolean): string[] {
  const delivery = [
    "Te avisamos por correo cuando salga a reparto.",
    "Recibes tu pedido en la dirección de entrega; ten a mano tu documento.",
  ];
  return hasBackorder
    ? [
        "Confirmamos tu pago y pedimos tus productos en importación.",
        "Cuando lleguen tus productos en importación, preparamos tu pedido completo.",
        ...delivery,
      ]
    : ["Confirmamos tu pago y preparamos tu pedido.", ...delivery];
}

/** Why a backorder takes longer, on the confirmation. */
export function backorderNoteText(leadTimeDays: {
  min: number;
  max: number;
}): string {
  return `Tu pedido incluye productos en importación: los pedimos al proveedor apenas confirmamos tu pago y llegan en ${leadTimeLabel(leadTimeDays)} hábiles. Te lo enviamos completo cuando todo esté disponible; puedes seguir cada paso con tu número de pedido.`;
}

export const ORDER_ACCESS_COPY = {
  title: "Confirma tu correo",
  description:
    "Para ver este pedido, escribe el correo con el que compraste. Así protegemos tus datos.",
  emailLabel: "Correo electrónico",
  submit: "Ver mi pedido",
  emailRequired: "Escribe tu correo electrónico.",
} as const;
