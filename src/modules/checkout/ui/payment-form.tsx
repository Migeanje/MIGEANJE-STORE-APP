"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { PaymentCard } from "@/modules/checkout/domain/payment-card";
import { formatPEN } from "@/shared/lib/money";
import { Button } from "@/shared/ui/atoms/button";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { CardPaymentFields } from "@/shared/ui/organisms/card-payment-fields";
import { ERROR_SUMMARY_TITLE } from "./checkout-copy";
import {
  PAYMENT_FIELDS,
  type PaymentField,
  type PaymentFormValues,
  paymentFormSchema,
} from "./checkout-forms";
import type { PayAction, PaymentFormState } from "./pay-action";
import { useCheckoutForm } from "./use-checkout-form";

export type PaymentFormProps = {
  action: PayAction;
  initialState: PaymentFormState;
  /** What "Pagar" charges, in céntimos. */
  total: number;
  termsHref: string;
};

const ID_PREFIX = "pago";
const FIELD_IDS: Record<PaymentField, string> = {
  cardNumber: `${ID_PREFIX}-number`,
  cardExpiry: `${ID_PREFIX}-expiry`,
  cardCvv: `${ID_PREFIX}-cvv`,
  cardHolder: `${ID_PREFIX}-holder`,
  acceptTerms: `${ID_PREFIX}-terms`,
};

/**
 * A schema per validation, so the expiry check uses the current month. The
 * schema reads `acceptTerms` as unknown (a checkbox gives "si" or false), hence
 * the cast of the options.
 */
const paymentResolver = ((values, context, options) =>
  zodResolver(paymentFormSchema(new Date()))(
    values,
    context,
    options as never,
  )) as Resolver<PaymentFormValues, unknown, PaymentCard>;

/**
 * Step 3: the simulated card payment ("Modo demostración") and "Pagar S/ X".
 * Card fields are never pre-filled: the server does not send them back.
 */
export function PaymentForm({
  action,
  initialState,
  total,
  termsHref,
}: PaymentFormProps) {
  const {
    form,
    state,
    pending,
    formAction,
    formRef,
    summaryRef,
    onSubmit,
    errors,
    summaryItems,
  } = useCheckoutForm({
    action,
    initialState,
    resolver: paymentResolver,
    fields: PAYMENT_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register } = form;
  const termsAccepted =
    (state.values as Partial<PaymentFormValues>).acceptTerms === "si";
  const { formError } = state;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-8"
    >
      <ErrorSummary
        ref={summaryRef}
        title={formError?.title ?? ERROR_SUMMARY_TITLE}
        headingLevel={3}
        message={
          formError ? (
            <div className="flex flex-col gap-2">
              <p className="text-pretty">{formError.message}</p>
              {formError.details && formError.details.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  {formError.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : undefined
        }
        items={summaryItems}
      />

      <CardPaymentFields
        idPrefix={ID_PREFIX}
        termsHref={termsHref}
        errors={{
          number: errors.cardNumber,
          expiry: errors.cardExpiry,
          cvv: errors.cardCvv,
          holder: errors.cardHolder,
          terms: errors.acceptTerms,
        }}
        inputProps={{
          number: register("cardNumber"),
          expiry: register("cardExpiry"),
          cvv: register("cardCvv"),
          holder: register("cardHolder"),
          terms: { ...register("acceptTerms"), defaultChecked: termsAccepted },
        }}
      />

      <Button
        type="submit"
        size="lg"
        loading={pending}
        className="w-full sm:w-auto"
      >
        Pagar {formatPEN(total)}
      </Button>
    </form>
  );
}
