"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCart } from "@/modules/cart/application/get-cart";
import {
  getCartRepository,
  getProductLookup,
} from "@/modules/cart/infrastructure";
import { readCartId } from "@/modules/cart/infrastructure/cart-cookie";
import { CART_PATH } from "@/modules/cart/ui/cart-paths";
import { discardCheckoutDraft } from "@/modules/checkout/application/discard-checkout-draft";
import { getCheckoutDraft } from "@/modules/checkout/application/get-checkout-draft";
import { pendingStep } from "@/modules/checkout/domain/checkout-draft";
import { getCheckoutDraftRepository } from "@/modules/checkout/infrastructure";
import {
  fieldErrorsOf,
  PAYMENT_FIELDS,
  paymentFormSchema,
  readFormValues,
} from "@/modules/checkout/ui/checkout-forms";
import { CHECKOUT_STEP_PATHS } from "@/modules/checkout/ui/checkout-paths";
import type { PaymentFormState } from "@/modules/checkout/ui/pay-action";
import { findOrder } from "@/modules/orders/application/find-order";
import { placeOrder } from "@/modules/orders/application/place-order";
import {
  getOrderRepository,
  getPaymentGateway,
} from "@/modules/orders/infrastructure";
import { writeOrderAccess } from "@/modules/orders/infrastructure/order-access-cookie";
import { features } from "@/shared/config/features";
import {
  cartChangedError,
  declinedError,
  ORDER_NOT_FOUND_MESSAGE,
  PAYMENT_FAILURE,
} from "./order-copy";
import { orderConfirmationPath } from "./order-paths";

/*
 * Orders server actions. `placeOrderAction` is the checkout's `PayAction`
 * (the /checkout/pago route passes it to the payment step). Card data goes
 * from the form to the payment gateway and nowhere else: it is not stored,
 * not logged and never sent back in the form state.
 */

/** Pays and places the order of this browser's cart and checkout draft. */
export async function placeOrderAction(
  previous: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const values = readFormValues(formData, PAYMENT_FIELDS);
  // Only the terms checkbox goes back to the page; never card data.
  const echo = { acceptTerms: values.acceptTerms };
  const attempt = previous.attempt + 1;

  const carts = getCartRepository();
  const cart = await getCart(carts, await readCartId());
  if (!cart || cart.lines.length === 0) redirect(CART_PATH);
  const drafts = getCheckoutDraftRepository();
  const draft = await getCheckoutDraft(drafts, cart.id);
  const facturaEnabled = features.factura;
  const step = draft ? pendingStep(draft, { facturaEnabled }) : "contact";
  if (step !== "payment") redirect(CHECKOUT_STEP_PATHS[step]);

  const parsed = paymentFormSchema(new Date()).safeParse(values);
  if (!parsed.success) {
    return {
      values: echo,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  let result: Awaited<ReturnType<typeof placeOrder>>;
  try {
    result = await placeOrder(
      {
        orders: getOrderRepository(),
        payments: getPaymentGateway(),
        products: getProductLookup(),
        carts,
      },
      { cart, draft, card: parsed.data, facturaEnabled },
    );
  } catch (error) {
    // The message only: never the request, which carries the card.
    console.error(
      "Placing an order failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { values: echo, errors: {}, formError: PAYMENT_FAILURE, attempt };
  }

  if (!result.ok) {
    const { error } = result;
    if (error.code === "empty_cart") redirect(CART_PATH);
    if (error.code === "incomplete_checkout") {
      redirect(CHECKOUT_STEP_PATHS[error.step]);
    }
    if (error.code === "cart_changed") {
      // Re-render the summary and header with the refreshed cart.
      refresh();
      return {
        values: echo,
        errors: {},
        formError: cartChangedError(error.changes),
        attempt,
      };
    }
    return {
      values: echo,
      errors: {},
      formError: declinedError(error.reason),
      attempt,
    };
  }

  await discardCheckoutDraft(drafts, cart.id);
  await writeOrderAccess(result.order);
  redirect(orderConfirmationPath(result.order.number));
}

export type UnlockOrderState = { message: string | null };

/**
 * Opens the confirmation of an order with its number and the buyer's email
 * (fields `number` and `email`). A wrong email answers like an unknown
 * number.
 */
export async function unlockOrderAction(
  _previous: UnlockOrderState,
  formData: FormData,
): Promise<UnlockOrderState> {
  const number = formData.get("number");
  const email = formData.get("email");
  if (typeof number !== "string" || typeof email !== "string") {
    return { message: ORDER_NOT_FOUND_MESSAGE };
  }
  const order = await findOrder(getOrderRepository(), number, email);
  if (!order) return { message: ORDER_NOT_FOUND_MESSAGE };

  await writeOrderAccess(order);
  redirect(orderConfirmationPath(order.number));
}
