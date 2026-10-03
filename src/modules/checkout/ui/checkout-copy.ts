// Customer-facing copy of the checkout (neutral Peruvian Spanish, "tú").
// DRAFT: every text here is pending owner review; shipping, taxes and
// receipts are policy-like.
import type { CheckoutStep } from "@/modules/checkout/domain/checkout-draft";
import type {
  DayRange,
  ShippingZone,
} from "@/modules/checkout/domain/shipping";

export const CHECKOUT_TITLE = "Finalizar compra";

export const STEP_LABELS: Record<CheckoutStep, string> = {
  contact: "Contacto y envío",
  receipt: "Comprobante",
  payment: "Pago",
};

/** Nuevo RUS: boletas without an IGV breakdown. */
export const TAX_NOTE = "Precios incluyen impuestos.";

export const ERROR_SUMMARY_TITLE = "Revisa estos datos";

export const CONTACT_MESSAGES = {
  emailRequired: "Escribe tu correo electrónico.",
  emailInvalid: "Revisa tu correo: debe ser como nombre@correo.com.",
  firstNameRequired: "Escribe tus nombres.",
  lastNameRequired: "Escribe tus apellidos.",
  nameTooLong: "Usa 60 caracteres como máximo.",
  documentTypeRequired: "Elige el tipo de documento.",
  documentNumberRequired: "Escribe el número de tu documento.",
  dniInvalid: "El DNI tiene 8 dígitos.",
  ceInvalid: "El carné de extranjería tiene de 9 a 12 letras o números.",
  phoneRequired: "Escribe tu celular.",
  phoneInvalid: "Escribe un celular de 9 dígitos que empiece con 9.",
  addressRequired: "Escribe tu dirección.",
  textTooLong: "Usa 150 caracteres como máximo.",
  departamentoRequired: "Elige tu departamento.",
  provinciaRequired: "Elige tu provincia.",
  distritoRequired: "Elige tu distrito.",
  provinciaMismatch: "Esa provincia no es del departamento que elegiste.",
  distritoMismatch: "Ese distrito no es de la provincia que elegiste.",
  ubigeoUnknown: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
} as const;

export const RECEIPT_MESSAGES = {
  typeRequired: "Elige el tipo de comprobante.",
  facturaDisabled: "Por ahora solo emitimos boletas.",
  rucFormat: "El RUC tiene 11 dígitos y empieza con 10 o 20.",
  rucCheckDigit: "Revisa el RUC: el último dígito no coincide.",
  businessNameRequired: "Escribe la razón social.",
  fiscalAddressRequired: "Escribe la dirección fiscal.",
  textTooLong: "Usa 200 caracteres como máximo.",
} as const;

export const PAYMENT_MESSAGES = {
  cardNumberRequired: "Escribe el número de tu tarjeta.",
  cardNumberInvalid: "Revisa el número de tu tarjeta.",
  expiryInvalid: "Escribe el vencimiento como MM/AA.",
  expired: "Tu tarjeta está vencida.",
  cvvInvalid: "El CVV tiene 3 o 4 dígitos.",
  holderRequired: "Escribe el nombre como aparece en la tarjeta.",
  holderTooLong: "Usa 60 caracteres como máximo.",
  termsRequired: "Acepta los términos y condiciones para continuar.",
} as const;

export const DOCUMENT_TYPE_LABELS = {
  dni: "DNI",
  ce: "Carné de extranjería",
} as const;

/** "24–48 h" style text for a business-day range. */
function dayRangeText({ min, max }: DayRange): string {
  return min === max ? `${min}` : `${min}–${max}`;
}

/** Under the shipping amount: where it goes. */
export function shippingLabel(
  zone: ShippingZone,
  departamentoName: string,
): string {
  switch (zone) {
    case "lima_metro":
      return "Envío a Lima Metropolitana";
    case "callao":
      return "Envío al Callao";
    case "rest_of_peru":
      return `Envío a ${departamentoName}`;
  }
}

/** The courier's time: hours in Lima and Callao, business days elsewhere. */
export function transitText(zone: ShippingZone, days: DayRange): string {
  return zone === "rest_of_peru"
    ? `${dayRangeText(days)} días hábiles`
    : `${days.min * 24}–${days.max * 24} h (días hábiles)`;
}

/** When the order arrives, with the import time of a backorder. */
export function deliveryEstimateText(quote: {
  zone: ShippingZone;
  transitDays: DayRange;
  leadTimeDays: DayRange | null;
  deliveryDays: DayRange;
}): string {
  if (!quote.leadTimeDays) {
    return `Entrega en ${transitText(quote.zone, quote.transitDays)}.`;
  }
  return `Entrega en ${dayRangeText(quote.deliveryDays)} días hábiles: ${dayRangeText(quote.leadTimeDays)} de importación y ${dayRangeText(quote.transitDays)} de envío.`;
}
