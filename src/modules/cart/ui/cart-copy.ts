// Customer-facing copy of the cart (neutral Peruvian Spanish, "tú").
// DRAFT: every message here is pending owner review.
import type { AddToCartError } from "@/modules/cart/application/add-to-cart";
import type { UpdateLineQuantityError } from "@/modules/cart/application/update-line-quantity";
import type {
  CartLine,
  CartLineProduct,
  LineAvailability,
  QuantityClamp,
  QuantityLimit,
} from "@/modules/cart/domain/cart";
import type { ShippingNoteKey } from "@/modules/cart/domain/cart-summary";

const COUNT_FORMAT = new Intl.NumberFormat("es-PE");

export const SHIPPING_NOTE = "El envío se calcula en el checkout.";
export const INVALID_PRODUCT_MESSAGE =
  "No encontramos ese producto. Recarga la página e inténtalo de nuevo.";
export const INVALID_QUANTITY_MESSAGE =
  "Escribe una cantidad de 1 o más, o quita el producto.";
export const CART_FAILURE_MESSAGE =
  "No pudimos actualizar tu carrito. Inténtalo de nuevo en un momento.";
export const NOT_IN_CART_MESSAGE = "Ese producto ya no está en tu carrito.";

/** "1 producto", "3 productos" (units, not lines). */
export function itemCountLabel(count: number): string {
  return `${COUNT_FORMAT.format(count)} ${count === 1 ? "producto" : "productos"}`;
}

function units(count: number): string {
  return `${count} ${count === 1 ? "unidad" : "unidades"}`;
}

/** "15–20 días", "3 días", "1 día". */
export function leadTimeLabel({ min, max }: { min: number; max: number }) {
  return min === max
    ? `${min} ${min === 1 ? "día" : "días"}`
    : `${min}–${max} días`;
}

/** The LED label of a line. */
export function availabilityLabel(availability: LineAvailability): string {
  return availability.status === "in_stock"
    ? "En stock"
    : `En importación · llega en ${leadTimeLabel(availability.leadTimeDays)}`;
}

/** The product with its variant: "Nano Charger 45W Smart Display (Blanco)". */
export function productDisplayName(
  product: Pick<CartLineProduct, "name" | "variantLabel">,
): string {
  return product.variantLabel === ""
    ? product.name
    : `${product.name} (${product.variantLabel})`;
}

/** How the order ships, under the subtotal. */
export function shippingNoteText(
  key: ShippingNoteKey,
  leadTimeDays: { min: number; max: number },
): string {
  const arrival = leadTimeLabel(leadTimeDays);
  switch (key) {
    case "ships_together_when_available":
      return `Tu pedido incluye productos en importación: lo enviamos completo cuando todo esté disponible, en ${arrival}.`;
    case "ships_on_arrival":
      return `Tus productos en importación llegan en ${arrival}; te avisamos en cada paso.`;
  }
}

/** Why a quantity stops at `limit.max`. */
export function limitSentence({ max, reason }: QuantityLimit): string {
  switch (reason) {
    case "in_stock_limit":
      return `Puedes llevar hasta ${units(max)} por producto.`;
    case "backorder_limit":
      return `Puedes pedir hasta ${units(max)} de un producto en importación.`;
    case "stock_limit":
      return `Solo nos quedan ${units(max)} de este producto.`;
  }
}

/** "Agregaste {producto} al carrito", plus the limit when it was clamped. */
export function addedMessage({
  line,
  added,
  clamped,
}: {
  line: CartLine;
  added: number;
  clamped: QuantityClamp | null;
}): string {
  const name = productDisplayName(line.product);
  const what = added === 1 ? name : `${units(added)} de ${name}`;
  const base = `Agregaste ${what} al carrito`;
  return clamped ? `${base}. ${limitSentence(clamped.limit)}` : base;
}

export function addErrorMessage(error: AddToCartError): string {
  switch (error.code) {
    case "unknown_sku":
      return INVALID_PRODUCT_MESSAGE;
    case "unavailable":
      return `No pudimos agregar ${productDisplayName(error.product)}: está agotado por ahora.`;
    case "limit_reached":
      return `Ya tienes ${units(error.quantity)} de ${productDisplayName(error.product)} en tu carrito. ${limitSentence(error.limit)}`;
  }
}

export function updatedMessage({
  line,
  clamped,
}: {
  line: CartLine;
  clamped: QuantityClamp | null;
}): string {
  const base = `Ahora tienes ${units(line.quantity)} de ${productDisplayName(line.product)}.`;
  return clamped ? `${base} ${limitSentence(clamped.limit)}` : base;
}

export function updateErrorMessage(error: UpdateLineQuantityError): string {
  switch (error.code) {
    case "not_in_cart":
      return NOT_IN_CART_MESSAGE;
    case "unknown_sku":
    case "unavailable":
      return `${productDisplayName(error.product)} se agotó: no pudimos cambiar la cantidad.`;
  }
}

export function removedMessage(removed: CartLine | null): string {
  return removed
    ? `Quitaste ${productDisplayName(removed.product)} del carrito.`
    : "Ese producto ya no estaba en tu carrito.";
}
