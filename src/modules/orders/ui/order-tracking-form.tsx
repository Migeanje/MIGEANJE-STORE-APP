"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { TRACKING_COPY } from "./order-copy";
import {
  TRACKING_FIELDS,
  type TrackingField,
  type TrackingFormState,
  trackingFormSchema,
} from "./tracking-form";

/** `trackOrderAction` (fields `number` and `email`). */
export type TrackAction = (
  state: TrackingFormState,
  formData: FormData,
) => Promise<TrackingFormState>;

export type OrderTrackingFormProps = {
  action: TrackAction;
  /** From `trackingInitialState(?numero=)`: only the number is prefilled. */
  initialState: TrackingFormState;
};

const FIELD_IDS: Record<TrackingField, string> = {
  number: "seguimiento-numero",
  email: "seguimiento-correo",
};

const trackingResolver = zodResolver(trackingFormSchema);

/**
 * The public lookup: order number (Geist Mono; lowercase and spaces are
 * fine) and the buyer's email. React Hook Form checks the fields on the
 * client, then the form posts to the server action, which also works
 * without JavaScript. Errors (client or server) land in the error summary,
 * which gets focus after a failed submit.
 */
export function OrderTrackingForm({
  action,
  initialState,
}: OrderTrackingFormProps) {
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
    resolver: trackingResolver,
    fields: TRACKING_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register } = form;
  const { formError, values } = state;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <ErrorSummary
        ref={summaryRef}
        title={formError?.title ?? ERROR_SUMMARY_TITLE}
        message={formError?.message}
        items={summaryItems}
      />
      <FormField
        label={TRACKING_COPY.numberLabel}
        hint={TRACKING_COPY.numberHint}
        required
        controlId={FIELD_IDS.number}
        error={errors.number}
      >
        {(control) => (
          <Input
            {...register("number")}
            defaultValue={values.number ?? ""}
            {...control}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={32}
            className="font-mono"
          />
        )}
      </FormField>
      <FormField
        label={TRACKING_COPY.emailLabel}
        hint={TRACKING_COPY.emailHint}
        required
        controlId={FIELD_IDS.email}
        error={errors.email}
      >
        {(control) => (
          <Input
            {...register("email")}
            defaultValue={values.email ?? ""}
            {...control}
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            maxLength={254}
          />
        )}
      </FormField>
      <div>
        <Button type="submit" size="lg" loading={pending}>
          {TRACKING_COPY.submit}
        </Button>
      </div>
    </form>
  );
}
