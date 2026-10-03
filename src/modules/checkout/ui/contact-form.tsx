"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import type { UbigeoTree } from "@/modules/checkout/domain/ubigeo";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { Select } from "@/shared/ui/atoms/select";
import { Text } from "@/shared/ui/atoms/text";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { UbigeoFields } from "@/shared/ui/molecules/ubigeo-fields";
import { DOCUMENT_TYPE_LABELS, ERROR_SUMMARY_TITLE } from "./checkout-copy";
import {
  CONTACT_FIELDS,
  type ContactField,
  contactFormSchema,
  type FormState,
} from "./checkout-forms";
import { ubigeoOptions } from "./checkout-view";
import { useCheckoutForm } from "./use-checkout-form";

export type ContactFormProps = {
  action: (
    state: FormState<ContactField>,
    formData: FormData,
  ) => Promise<FormState<ContactField>>;
  initialState: FormState<ContactField>;
  /** Departamentos, provincias and distritos for the selects. */
  ubigeo: UbigeoTree;
};

const ID_PREFIX = "checkout";
const FIELD_IDS = Object.fromEntries(
  CONTACT_FIELDS.map((field) => [field, `${ID_PREFIX}-${field}`]),
) as Record<ContactField, string>;

const fieldsetClassName = "flex flex-col gap-4";
const legendClassName = "mb-4 text-body font-medium text-foreground";

/**
 * Step 1: contact (email, names, document, mobile) and delivery address with
 * cascading ubigeo selects. Without JavaScript the selects cannot filter, so
 * an "Actualizar provincias y distritos" button reloads their options.
 */
export function ContactForm({
  action,
  initialState,
  ubigeo,
}: ContactFormProps) {
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
    resolver: zodResolver(contactFormSchema),
    fields: CONTACT_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register, setValue, watch } = form;
  const values = state.values;

  const departamento = watch("departamento") ?? "";
  const provincia = watch("provincia") ?? "";
  const options = useMemo(
    () => ubigeoOptions(ubigeo, { departamento, provincia }),
    [ubigeo, departamento, provincia],
  );

  /** Input props for a text field: registration, id and the posted value. */
  function textField(field: ContactField) {
    return { ...register(field), defaultValue: values[field] ?? "" };
  }

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
        title={ERROR_SUMMARY_TITLE}
        headingLevel={3}
        items={summaryItems}
      />

      <fieldset className={fieldsetClassName}>
        <legend className={legendClassName}>Tus datos</legend>
        <FormField
          label="Correo electrónico"
          hint="Te enviamos aquí la confirmación y tu boleta."
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
              spellCheck={false}
            />
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nombres"
            required
            controlId={FIELD_IDS.firstName}
            error={errors.firstName}
          >
            {(control) => (
              <Input
                {...textField("firstName")}
                {...control}
                autoComplete="given-name"
              />
            )}
          </FormField>
          <FormField
            label="Apellidos"
            required
            controlId={FIELD_IDS.lastName}
            error={errors.lastName}
          >
            {(control) => (
              <Input
                {...textField("lastName")}
                {...control}
                autoComplete="family-name"
              />
            )}
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <FormField
            label="Tipo de documento"
            required
            controlId={FIELD_IDS.documentType}
            error={errors.documentType}
          >
            {(control) => (
              <Select
                {...register("documentType")}
                defaultValue={values.documentType ?? "dni"}
                {...control}
              >
                <option value="dni">{DOCUMENT_TYPE_LABELS.dni}</option>
                <option value="ce">{DOCUMENT_TYPE_LABELS.ce}</option>
              </Select>
            )}
          </FormField>
          <FormField
            label="Número de documento"
            hint="Para tu boleta de venta electrónica."
            required
            controlId={FIELD_IDS.documentNumber}
            error={errors.documentNumber}
          >
            {(control) => (
              <Input
                {...textField("documentNumber")}
                {...control}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </FormField>
        </div>
        <FormField
          label="Celular"
          hint="9 dígitos, por ejemplo 987 654 321. El courier te llama a este número."
          required
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
            />
          )}
        </FormField>
      </fieldset>

      <fieldset className={fieldsetClassName}>
        <legend className={legendClassName}>Dirección de entrega</legend>
        <FormField
          label="Dirección"
          hint="Calle, número, interior o departamento."
          required
          controlId={FIELD_IDS.addressLine}
          error={errors.addressLine}
        >
          {(control) => (
            <Input
              {...textField("addressLine")}
              {...control}
              autoComplete="address-line1"
            />
          )}
        </FormField>
        <FormField
          label="Referencia (opcional)"
          hint="Por ejemplo: frente al parque, portón negro."
          controlId={FIELD_IDS.addressReference}
          error={errors.addressReference}
        >
          {(control) => (
            <Input
              {...textField("addressReference")}
              {...control}
              autoComplete="address-line2"
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
              Sin JavaScript, las listas no se filtran solas: elige tu
              departamento (y luego tu provincia) y pulsa «Actualizar provincias
              y distritos».
            </Text>
          }
        />
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* First submit button: Enter in a field continues. */}
        <Button type="submit" size="lg" loading={pending}>
          Continuar al comprobante
        </Button>
        <Button
          type="submit"
          name="intent"
          value="ubigeo"
          variant="secondary"
          size="lg"
          className="hidden noscript:inline-flex"
        >
          Actualizar provincias y distritos
        </Button>
      </div>
    </form>
  );
}
