import type { CartLine } from "@/modules/cart/domain/cart";
import { lineTotal, summarizeCart } from "@/modules/cart/domain/cart-summary";
import {
  availabilityLabel,
  shippingNoteText,
} from "@/modules/cart/ui/cart-copy";
import {
  CHECKOUT_STEPS,
  type CheckoutStep,
  type ContactDetails,
} from "@/modules/checkout/domain/checkout-draft";
import { checkoutTotals } from "@/modules/checkout/domain/checkout-totals";
import type { Receipt } from "@/modules/checkout/domain/receipt";
import {
  departamentosOf,
  distritosOf,
  provinciasOf,
  type ResolvedUbigeo,
  type UbigeoPlace,
  type UbigeoTree,
} from "@/modules/checkout/domain/ubigeo";
import type { CheckoutStepItem } from "@/shared/ui/molecules/checkout-steps";
import type { OrderSummaryProps } from "@/shared/ui/organisms/order-summary";
import {
  deliveryEstimateText,
  STEP_LABELS,
  shippingLabel,
  TAX_NOTE,
} from "./checkout-copy";
import type { ContactFormValues, ReceiptFormValues } from "./checkout-forms";
import { CHECKOUT_STEP_PATHS } from "./checkout-paths";

export { deliveryEstimateText, shippingLabel };

/** The progress indicator: steps before `current` link back. */
export function checkoutSteps(current: CheckoutStep): CheckoutStepItem[] {
  const currentIndex = CHECKOUT_STEPS.indexOf(current);
  return CHECKOUT_STEPS.map((step, index) => ({
    id: step,
    label: STEP_LABELS[step],
    href: CHECKOUT_STEP_PATHS[step],
    state:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming",
  }));
}

export type OrderSummaryView = Pick<
  OrderSummaryProps,
  "lines" | "subtotal" | "shipping" | "shippingLabel" | "total" | "notes"
>;

/**
 * The order summary of the checkout: lines with their availability (and lead
 * time), subtotal, shipping and total once the address is known, and notes
 * (taxes, delivery estimate, how a backorder ships).
 */
export function orderSummaryView(
  lines: readonly CartLine[],
  ubigeo: ResolvedUbigeo | null,
): OrderSummaryView {
  const totals = checkoutTotals(
    lines,
    ubigeo
      ? {
          departamento: ubigeo.departamento.code,
          provincia: ubigeo.provincia.code,
        }
      : null,
  );
  const notes = [TAX_NOTE];
  if (totals.shipping) notes.push(deliveryEstimateText(totals.shipping));
  const { shippingNote, leadTimeDays } = summarizeCart(lines);
  if (shippingNote && leadTimeDays) {
    notes.push(shippingNoteText(shippingNote, leadTimeDays));
  }

  return {
    lines: lines.map((line) => ({
      key: line.sku,
      name: line.product.name,
      variantLabel:
        line.product.variantLabel === ""
          ? undefined
          : line.product.variantLabel,
      quantity: line.quantity,
      lineTotal: lineTotal(line),
      availability: {
        status: line.availability.status,
        label: availabilityLabel(line.availability),
      },
    })),
    subtotal: totals.subtotal,
    shipping: totals.shipping?.cost ?? null,
    shippingLabel:
      totals.shipping && ubigeo
        ? shippingLabel(totals.shipping.zone, ubigeo.departamento.name)
        : undefined,
    total: totals.total,
    notes,
  };
}

const COLLATOR = new Intl.Collator("es-PE");

function byName(places: UbigeoPlace[]): UbigeoPlace[] {
  return places.sort((a, b) => COLLATOR.compare(a.name, b.name));
}

/**
 * Options of the three ubigeo selects, sorted by name: every departamento,
 * the provincias of the selected one and the distritos of the selected
 * provincia (none when it is not in that departamento).
 */
export function ubigeoOptions(
  tree: UbigeoTree,
  selected: { departamento: string; provincia: string },
): {
  departamentos: UbigeoPlace[];
  provincias: UbigeoPlace[];
  distritos: UbigeoPlace[];
} {
  const provincias = provinciasOf(tree, selected.departamento);
  const provinciaInDepartamento = provincias.some(
    ({ code }) => code === selected.provincia,
  );
  return {
    departamentos: byName(departamentosOf(tree)),
    provincias: byName(provincias),
    distritos: provinciaInDepartamento
      ? byName(distritosOf(tree, selected.provincia))
      : [],
  };
}

/** The contact form filled from the draft (empty, DNI first, without one). */
export function contactFormDefaults(
  contact: ContactDetails | null,
): ContactFormValues {
  if (!contact) {
    return {
      email: "",
      firstName: "",
      lastName: "",
      documentType: "dni",
      documentNumber: "",
      phone: "",
      addressLine: "",
      addressReference: "",
      departamento: "",
      provincia: "",
      distrito: "",
    };
  }
  const { customer, address } = contact;
  return {
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    documentType: customer.document.type,
    documentNumber: customer.document.number,
    phone: customer.phone,
    addressLine: address.line,
    addressReference: address.reference,
    departamento: address.ubigeo.departamento.code,
    provincia: address.ubigeo.provincia.code,
    distrito: address.ubigeo.distrito.code,
  };
}

/** The receipt form filled from the draft (boleta without one). */
export function receiptFormDefaults(
  receipt: Receipt | null,
): ReceiptFormValues {
  if (receipt?.type === "factura") {
    return {
      receiptType: "factura",
      ruc: receipt.ruc,
      businessName: receipt.businessName,
      fiscalAddress: receipt.fiscalAddress,
    };
  }
  return {
    receiptType: "boleta",
    ruc: "",
    businessName: "",
    fiscalAddress: "",
  };
}
