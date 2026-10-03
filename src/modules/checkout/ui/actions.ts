"use server";

import { redirect } from "next/navigation";
import { getCart } from "@/modules/cart/application/get-cart";
import type { Cart } from "@/modules/cart/domain/cart";
import { getCartRepository } from "@/modules/cart/infrastructure";
import { readCartId } from "@/modules/cart/infrastructure/cart-cookie";
import { CART_PATH } from "@/modules/cart/ui/cart-paths";
import { saveContact } from "@/modules/checkout/application/save-contact";
import { saveReceipt } from "@/modules/checkout/application/save-receipt";
import {
  getCheckoutDraftRepository,
  getUbigeoDirectory,
} from "@/modules/checkout/infrastructure";
import { features } from "@/shared/config/features";
import { CONTACT_MESSAGES, RECEIPT_MESSAGES } from "./checkout-copy";
import {
  CONTACT_FIELDS,
  type ContactField,
  contactFormSchema,
  type FormState,
  fieldErrorsOf,
  RECEIPT_FIELDS,
  type ReceiptField,
  readFormValues,
  receiptFormSchema,
} from "./checkout-forms";
import { CHECKOUT_STEP_PATHS } from "./checkout-paths";

/*
 * Server actions of the checkout steps. The server validates every step
 * with the same schemas as the client (authoritative) and keeps the draft
 * per cart (the cart cookie is the key). On success they redirect to the
 * next step, which also works without JavaScript (303 after the post).
 */

/** The cart of this browser, or a redirect to /carrito when it is empty. */
async function requireCart(): Promise<Cart> {
  const cart = await getCart(getCartRepository(), await readCartId());
  if (!cart || cart.lines.length === 0) redirect(CART_PATH);
  return cart;
}

/**
 * Step 1 (contact and shipping address). With `intent=ubigeo` (the
 * no-JavaScript "update" button) it only answers the values back, dropping a
 * provincia or distrito that no longer belongs to the selected parent, so
 * the page re-renders with the right options.
 */
export async function saveContactAction(
  previous: FormState<ContactField>,
  formData: FormData,
): Promise<FormState<ContactField>> {
  const cart = await requireCart();
  const values = readFormValues(formData, CONTACT_FIELDS);

  if (formData.get("intent") === "ubigeo") {
    const provincia =
      values.departamento !== "" &&
      values.provincia.startsWith(values.departamento)
        ? values.provincia
        : "";
    const distrito =
      provincia !== "" && values.distrito.startsWith(provincia)
        ? values.distrito
        : "";
    return {
      values: { ...values, provincia, distrito },
      errors: {},
      formError: null,
      attempt: previous.attempt,
    };
  }

  const attempt = previous.attempt + 1;
  const parsed = contactFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  const saved = await saveContact(
    { drafts: getCheckoutDraftRepository(), ubigeo: getUbigeoDirectory() },
    cart.id,
    parsed.data,
  );
  if (!saved.ok) {
    return {
      values,
      errors: { distrito: CONTACT_MESSAGES.ubigeoUnknown },
      formError: null,
      attempt,
    };
  }
  redirect(CHECKOUT_STEP_PATHS.receipt);
}

/** Step 2 (comprobante): a boleta, or a factura while the flag is on. */
export async function saveReceiptAction(
  previous: FormState<ReceiptField>,
  formData: FormData,
): Promise<FormState<ReceiptField>> {
  const cart = await requireCart();
  const values = readFormValues(formData, RECEIPT_FIELDS);
  const attempt = previous.attempt + 1;
  const facturaEnabled = features.factura;

  const parsed = receiptFormSchema({ facturaEnabled }).safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  const saved = await saveReceipt(
    getCheckoutDraftRepository(),
    cart.id,
    parsed.data,
    { facturaEnabled },
  );
  if (!saved.ok) {
    if (saved.error === "contact_missing")
      redirect(CHECKOUT_STEP_PATHS.contact);
    return {
      values,
      errors: { receiptType: RECEIPT_MESSAGES.facturaDisabled },
      formError: null,
      attempt,
    };
  }
  redirect(CHECKOUT_STEP_PATHS.payment);
}
