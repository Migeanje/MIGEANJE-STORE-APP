"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { RECOVER_COPY } from "./account-copy";
import {
  RECOVER_FIELDS,
  type RecoverField,
  type RecoverFormState,
  recoverFormSchema,
} from "./account-forms";

/** `recoverAction` (field `email`). */
export type RecoverAction = (
  state: RecoverFormState,
  formData: FormData,
) => Promise<RecoverFormState>;

export type RecoverFormProps = {
  action: RecoverAction;
  initialState: RecoverFormState;
};

const FIELD_IDS: Record<RecoverField, string> = { email: "recuperar-correo" };

const recoverResolver = zodResolver(recoverFormSchema);

/** "Olvidé mi contraseña": the email of the account, nothing else. */
export function RecoverForm({ action, initialState }: RecoverFormProps) {
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
    resolver: recoverResolver,
    fields: RECOVER_FIELDS,
    fieldIds: FIELD_IDS,
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={RECOVER_COPY.title}
      className="flex flex-col gap-6"
    >
      <ErrorSummary
        ref={summaryRef}
        title={state.formError?.title ?? ERROR_SUMMARY_TITLE}
        message={state.formError?.message}
        items={summaryItems}
      />
      <FormField
        label={RECOVER_COPY.emailLabel}
        required
        controlId={FIELD_IDS.email}
        error={errors.email}
      >
        {(control) => (
          <Input
            {...form.register("email")}
            defaultValue={state.values.email ?? ""}
            {...control}
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            maxLength={254}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {RECOVER_COPY.submit}
      </Button>
    </form>
  );
}
