"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo } from "react";
import type { Resolver } from "react-hook-form";
import type { UbigeoTree } from "@/modules/checkout/domain/ubigeo";
import { ERROR_SUMMARY_TITLE } from "@/modules/checkout/ui/checkout-copy";
import { ubigeoOptions } from "@/modules/checkout/ui/checkout-view";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { Text } from "@/shared/ui/atoms/text";
import { CheckboxField } from "@/shared/ui/molecules/checkbox-field";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { UbigeoFields } from "@/shared/ui/molecules/ubigeo-fields";
import { ADDRESSES_COPY } from "./account-copy";
import {
  ADDRESS_FIELDS,
  type AddressField,
  type AddressFormState,
  addressFormSchema,
} from "./account-forms";

/** `saveAddressAction`. */
export type SaveAddressAction = (
  state: AddressFormState,
  formData: FormData,
) => Promise<AddressFormState>;

export type AddressFormProps = {
  action: SaveAddressAction;
  /** Empty for a new address; the address's values to edit one. */
  initialState: AddressFormState;
  /** Departamentos, provincias and distritos for the selects. */
  ubigeo: UbigeoTree;
  /** While editing: where "Cancelar" goes (the page without `?editar=`). */
  cancelHref?: string;
};

const ID_PREFIX = "direccion";
const FIELD_IDS = Object.fromEntries(
  ADDRESS_FIELDS.map((field) => [field, `${ID_PREFIX}-${field}`]),
) as Record<AddressField, string>;

// The schema reads `makeDefault` as unknown (a checkbox gives "si" or false).
const addressResolver = zodResolver(addressFormSchema) as Resolver<
  Record<AddressField, string>,
  unknown,
  unknown
>;

/**
 * Adds or edits an address of the address book: name, street, reference,
 * cascading ubigeo selects (with the no-JavaScript "update" submit, like the
 * checkout) and "use as the main address".
 */
export function AddressForm({
  action,
  initialState,
  ubigeo,
  cancelHref,
}: AddressFormProps) {
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
    resolver: addressResolver,
    fields: ADDRESS_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register, setValue, watch } = form;
  const { values } = state;
  const editing = (values.addressId ?? "") !== "";

  const departamento = watch("departamento") ?? "";
  const provincia = watch("provincia") ?? "";
  const options = useMemo(
    () => ubigeoOptions(ubigeo, { departamento, provincia }),
    [ubigeo, departamento, provincia],
  );

  function textField(field: AddressField) {
    return { ...register(field), defaultValue: values[field] ?? "" };
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <input
        type="hidden"
        {...register("addressId")}
        defaultValue={values.addressId ?? ""}
      />
      <ErrorSummary
        ref={summaryRef}
        title={state.formError?.title ?? ERROR_SUMMARY_TITLE}
        message={state.formError?.message}
        headingLevel={3}
        items={summaryItems}
      />
      <FormField
        label={ADDRESSES_COPY.labelLabel}
        hint={ADDRESSES_COPY.labelHint}
        controlId={FIELD_IDS.label}
        error={errors.label}
      >
        {(control) => (
          <Input {...textField("label")} {...control} maxLength={40} />
        )}
      </FormField>
      <FormField
        label={ADDRESSES_COPY.lineLabel}
        hint={ADDRESSES_COPY.lineHint}
        required
        controlId={FIELD_IDS.addressLine}
        error={errors.addressLine}
      >
        {(control) => (
          <Input
            {...textField("addressLine")}
            {...control}
            autoComplete="address-line1"
            maxLength={150}
          />
        )}
      </FormField>
      <FormField
        label={ADDRESSES_COPY.referenceLabel}
        hint={ADDRESSES_COPY.referenceHint}
        controlId={FIELD_IDS.addressReference}
        error={errors.addressReference}
      >
        {(control) => (
          <Input
            {...textField("addressReference")}
            {...control}
            autoComplete="address-line2"
            maxLength={150}
          />
        )}
      </FormField>
      <UbigeoFields
        idPrefix={ID_PREFIX}
        departamentos={options.departamentos}
        provincias={options.provincias}
        distritos={options.distritos}
        defaultValues={{
          departamento: values.departamento ?? "",
          provincia: values.provincia ?? "",
          distrito: values.distrito ?? "",
        }}
        errors={{
          departamento: errors.departamento,
          provincia: errors.provincia,
          distrito: errors.distrito,
        }}
        selectProps={{
          departamento: register("departamento", {
            onChange: () => {
              setValue("provincia", "");
              setValue("distrito", "");
            },
          }),
          provincia: register("provincia", {
            onChange: () => setValue("distrito", ""),
          }),
          distrito: register("distrito"),
        }}
        refreshControl={
          <Text size="body-sm" tone="muted" className="hidden noscript:block">
            {ADDRESSES_COPY.noScriptUbigeo}
          </Text>
        }
      />
      <CheckboxField
        {...register("makeDefault")}
        id={FIELD_IDS.makeDefault}
        value="si"
        defaultChecked={values.makeDefault === "si"}
        label={ADDRESSES_COPY.makeDefault}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* First submit button: Enter in a field saves. */}
        <Button type="submit" size="lg" loading={pending}>
          {editing ? ADDRESSES_COPY.submitEdit : ADDRESSES_COPY.submitNew}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="ubigeo"
          variant="secondary"
          size="lg"
          className="hidden noscript:inline-flex"
        >
          {ADDRESSES_COPY.refreshUbigeo}
        </Button>
        {editing && cancelHref ? (
          <Button asChild variant="ghost" size="lg">
            <Link href={cancelHref}>{ADDRESSES_COPY.cancelEdit}</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
