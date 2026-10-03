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

/** One sentence per status on the tracking timeline (reads well done or pending). */
export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pagado: "Confirmamos tu pago.",
  en_importacion: "Pedimos tus productos al proveedor y los traemos al Perú.",
  preparando: "Revisamos y empacamos tu pedido.",
  en_camino: "El courier lleva tu pedido a tu dirección.",
  entregado: "Tu pedido llega a la dirección de entrega.",
};

/** What "En importación" means, while an order is importing. */
export function importNote(leadTimeDays: { min: number; max: number }) {
  return {
    title: "Tu pedido está en importación",
    paragraphs: [
      "Pedimos tus productos al proveedor especialmente para ti apenas confirmamos tu pago.",
      `La importación suele tomar ${leadTimeLabel(leadTimeDays)} hábiles y ya está incluida en la fecha estimada de entrega.`,
      "Te escribiremos a tu correo en cada paso: cuando lleguen tus productos, cuando preparemos tu pedido y cuando salga a reparto.",
    ],
  };
}

/** Where tracking updates go (the email partly hidden). */
export function updatesNote(maskedEmail: string): string {
  return `Te avisamos de cada cambio por correo a ${maskedEmail}.`;
}

/** A backorder line once its import is over. */
export const IMPORTED_LINE_LABEL = "Llegó de importación";

export const RECEIPT_TYPE_LABELS = {
  boleta: "Boleta de venta electrónica",
  factura: "Factura electrónica",
} as const;

/**
 * Help on the tracking page. No contact channel (email, WhatsApp) is defined
 * yet: add it here when it exists.
 */
export const TRACKING_HELP_LINKS = [
  { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
  { href: "/envios-y-devoluciones", label: "Envíos y devoluciones" },
  { href: "/garantias", label: "Garantías" },
] as const;

export const PAYMENT_FAILED_TITLE = "No pudimos procesar el pago";

export const PAYMENT_FAILURE = {
  title: PAYMENT_FAILED_TITLE,
  message:
    "Algo salió mal de nuestro lado. Espera un momento e inténtalo de nuevo.",
};

/**
 * The card was charged but the order could not be stored: the charge is kept
 * for reconciliation. Never "try again" (it would charge twice).
 */
export function paymentRegisteredError(reference: string) {
  return {
    title: "Registramos tu pago",
    message: `Recibimos tu pago, pero no pudimos terminar de registrar tu pedido. No vuelvas a pagar: revisaremos tu pago y te escribiremos a tu correo para confirmar tu pedido. Tu código de referencia es ${reference}.`,
  };
}

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
  if (change.kind === "quote") {
    return `El total ahora es ${formatPEN(change.to)}.`;
  }
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

type QuoteChange = Extract<CartChange, { kind: "quote" }>;

export function cartChangedError(changes: readonly CartChange[]): {
  title: string;
  message: string;
  details?: string[];
} {
  const quote = changes.find(
    (change): change is QuoteChange => change.kind === "quote",
  );
  if (quote) {
    return {
      title: "Tu carrito cambió",
      message: `Tu carrito cambió después de que abriste esta página, quizás en otra pestaña. Revisa tu pedido antes de pagar: el total ahora es ${formatPEN(quote.to)}. No se hizo ningún cargo.`,
    };
  }
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

/** Public order tracking (/pedidos/seguimiento). */
export const TRACKING_COPY = {
  title: "Seguimiento de pedido",
  intro:
    "Escribe tu número de pedido y el correo con el que compraste para ver en qué va tu pedido.",
  numberLabel: "Número de pedido",
  numberHint: "Está en tu correo de confirmación, por ejemplo MG-2026-004521.",
  numberRequired: "Escribe tu número de pedido.",
  numberInvalid: "Revisa el número de pedido: tiene la forma MG-2026-004521.",
  emailLabel: "Correo electrónico",
  emailHint: "El mismo que usaste al comprar.",
  submit: "Consultar pedido",
  notFound: {
    title: "Revisa estos datos",
    message:
      "No encontramos un pedido con esos datos. Revisa el número y el correo con el que compraste.",
  },
  tooManyAttempts: {
    title: "Demasiados intentos",
    message:
      "Por tu seguridad pausamos las consultas desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
  },
  failure: {
    title: "No pudimos consultar tu pedido",
    message:
      "Algo salió mal de nuestro lado. Espera un momento e inténtalo de nuevo.",
  },
  anotherOrder: "Consultar otro pedido",
  demoTitle: "Datos de demostración",
  demoIntro: "Prueba con el correo",
  demoOrders: "y uno de estos pedidos:",
} as const;

export const ORDER_ACCESS_COPY = {
  title: "Confirma tu correo",
  description:
    "Para ver este pedido, escribe el correo con el que compraste. Así protegemos tus datos.",
  emailLabel: "Correo electrónico",
  submit: "Ver mi pedido",
  emailRequired: "Escribe tu correo electrónico.",
} as const;
