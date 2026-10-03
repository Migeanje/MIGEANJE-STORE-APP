"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import type { Resolver } from "react-hook-form";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { CheckboxField } from "@/shared/ui/molecules/checkbox-field";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { PASSWORD_RULE_LABELS, REGISTER_COPY } from "./account-copy";
import {
  REGISTER_FIELDS,
  type RegisterField,
  type RegisterFormState,
  registerFormSchema,
} from "./account-forms";
import { RETURN_PARAM } from "./account-paths";

/** `registerAction`. */
export type RegisterAction = (
  state: RegisterFormState,
  formData: FormData,
) => Promise<RegisterFormState>;

export type RegisterFormProps = {
  action: RegisterAction;
  initialState: RegisterFormState;
  returnTo?: string | null;
  termsHref: string;
  privacyHref: string;
};

const FIELD_IDS = Object.fromEntries(
  REGISTER_FIELDS.map((field) => [field, `registro-${field}`]),
) as Record<RegisterField, string>;

// The schema reads `acceptTerms` as unknown (a checkbox gives "si" or false).
const registerResolver = zodResolver(registerFormSchema) as Resolver<
  Record<RegisterField, string>,
  unknown,
  unknown
>;

const PASSWORD_HINT = `${REGISTER_COPY.passwordRulesTitle} ${PASSWORD_RULE_LABELS.length}, ${PASSWORD_RULE_LABELS.letter} y ${PASSWORD_RULE_LABELS.digit}.`;

const linkClassName =
  "underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Registration: names, email, optional mobile, a new password (its rules are
 * the hint, before typing) and the consent to the terms and the privacy
 * policy. Same pattern as every form: client checks, server action,
 * works without JavaScript; the password is never sent back.
 */
export function RegisterForm({
  action,
  initialState,
  returnTo,
  termsHref,
  privacyHref,
}: RegisterFormProps) {
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
    resolver: registerResolver,
    fields: REGISTER_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register } = form;
  const { formError, values } = state;

  function textField(
    field: Exclude<RegisterField, "password" | "acceptTerms">,
  ) {
    return { ...register(field), defaultValue: values[field] ?? "" };
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={REGISTER_COPY.title}
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
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label={REGISTER_COPY.firstNameLabel}
          required
          controlId={FIELD_IDS.firstName}
          error={errors.firstName}
        >
          {(control) => (
            <Input
              {...textField("firstName")}
              {...control}
              autoComplete="given-name"
              maxLength={60}
            />
          )}
        </FormField>
        <FormField
          label={REGISTER_COPY.lastNameLabel}
          required
          controlId={FIELD_IDS.lastName}
          error={errors.lastName}
        >
          {(control) => (
            <Input
              {...textField("lastName")}
              {...control}
              autoComplete="family-name"
              maxLength={60}
            />
          )}
        </FormField>
      </div>
      <FormField
        label={REGISTER_COPY.emailLabel}
        hint={REGISTER_COPY.emailHint}
        required
        controlId={FIELD_IDS.email}
        error={errors.email}
      >
        {(control) => (
          <Input
            {...textField("email")}
            {...control}
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            maxLength={254}
          />
        )}
      </FormField>
      <FormField
        label={REGISTER_COPY.phoneLabel}
        hint={REGISTER_COPY.phoneHint}
        controlId={FIELD_IDS.phone}
        error={errors.phone}
      >
        {(control) => (
          <Input
            {...textField("phone")}
            {...control}
            type="tel"
            autoComplete="tel-national"
            inputMode="tel"
            maxLength={20}
          />
        )}
      </FormField>
      <FormField
        label={REGISTER_COPY.passwordLabel}
        hint={PASSWORD_HINT}
        required
        controlId={FIELD_IDS.password}
        error={errors.password}
      >
        {(control) => (
          <Input
            {...register("password")}
            {...control}
            type="password"
            autoComplete="new-password"
            maxLength={1024}
          />
        )}
      </FormField>
      <CheckboxField
        {...register("acceptTerms")}
        id={FIELD_IDS.acceptTerms}
        value="si"
        defaultChecked={values.acceptTerms === "si"}
        required
        aria-required
        error={errors.acceptTerms}
        label={
          <>
            Acepto los{" "}
            <Link href={termsHref} className={linkClassName}>
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href={privacyHref} className={linkClassName}>
              política de privacidad
            </Link>
            .
          </>
        }
      />
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {REGISTER_COPY.submit}
      </Button>
    </form>
  );
}
