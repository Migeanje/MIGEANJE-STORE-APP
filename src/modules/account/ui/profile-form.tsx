"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { PROFILE_COPY, REGISTER_COPY } from "./account-copy";
import {
  PROFILE_FIELDS,
  type ProfileField,
  type ProfileFormState,
  profileFormSchema,
} from "./account-forms";

/** `updateProfileAction`. */
export type ProfileAction = (
  state: ProfileFormState,
  formData: FormData,
) => Promise<ProfileFormState>;

export type ProfileFormProps = {
  action: ProfileAction;
  /** Filled with the account's current names and mobile. */
  initialState: ProfileFormState;
};

const FIELD_IDS = Object.fromEntries(
  PROFILE_FIELDS.map((field) => [field, `perfil-${field}`]),
) as Record<ProfileField, string>;

const profileResolver = zodResolver(profileFormSchema);

/** "Mis datos": names and mobile (the email cannot change yet). */
export function ProfileForm({ action, initialState }: ProfileFormProps) {
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
    resolver: profileResolver,
    fields: PROFILE_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register } = form;
  const { values } = state;

  function textField(field: ProfileField) {
    return { ...register(field), defaultValue: values[field] ?? "" };
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={PROFILE_COPY.title}
      className="flex max-w-xl flex-col gap-6"
    >
      <ErrorSummary
        ref={summaryRef}
        title={state.formError?.title ?? ERROR_SUMMARY_TITLE}
        message={state.formError?.message}
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
      <div>
        <Button type="submit" size="lg" loading={pending}>
          {PROFILE_COPY.submit}
        </Button>
      </div>
    </form>
  );
}
