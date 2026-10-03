"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { LOG_IN_COPY } from "./account-copy";
import {
  LOG_IN_FIELDS,
  type LogInField,
  type LogInFormState,
  logInFormSchema,
} from "./account-forms";
import { RETURN_PARAM } from "./account-paths";

/** `logInAction` (fields `email`, `password` and `volver`). */
export type LogInAction = (
  state: LogInFormState,
  formData: FormData,
) => Promise<LogInFormState>;

export type LogInFormProps = {
  action: LogInAction;
  initialState: LogInFormState;
  /** A safe path to come back to after signing in (`?volver=`), if any. */
  returnTo?: string | null;
};

const FIELD_IDS: Record<LogInField, string> = {
  email: "ingreso-correo",
  password: "ingreso-contrasena",
};

const logInResolver = zodResolver(logInFormSchema);

/**
 * Sign-in: email and password (password managers welcome: standard
 * autocomplete hints, paste allowed). Checked on the client with the server's
 * schema, then posted to the server action, which also works without
 * JavaScript. Errors land in the error summary, which gets focus.
 */
export function LogInForm({ action, initialState, returnTo }: LogInFormProps) {
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
    resolver: logInResolver,
    fields: LOG_IN_FIELDS,
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
      aria-label={LOG_IN_COPY.title}
      className="flex flex-col gap-6"
    >
      {returnTo ? (
        <input type="hidden" name={RETURN_PARAM} value={returnTo} />
      ) : null}
      <ErrorSummary
        ref={summaryRef}
        title={formError?.title ?? ERROR_SUMMARY_TITLE}
        message={formError?.message}
        items={summaryItems}
      />
      <FormField
        label={LOG_IN_COPY.emailLabel}
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
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            maxLength={254}
          />
        )}
      </FormField>
      <FormField
        label={LOG_IN_COPY.passwordLabel}
        required
        controlId={FIELD_IDS.password}
        error={errors.password}
      >
        {(control) => (
          <Input
            {...register("password")}
            {...control}
            type="password"
            autoComplete="current-password"
            maxLength={1024}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {LOG_IN_COPY.submit}
      </Button>
    </form>
  );
}
