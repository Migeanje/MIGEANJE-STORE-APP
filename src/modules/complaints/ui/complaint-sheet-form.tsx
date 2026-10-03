"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useMemo } from "react";
import type { Resolver } from "react-hook-form";
import type { UbigeoTree } from "@/modules/checkout/domain/ubigeo";
import {
  DOCUMENT_TYPE_LABELS,
  ERROR_SUMMARY_TITLE,
} from "@/modules/checkout/ui/checkout-copy";
import { ubigeoOptions } from "@/modules/checkout/ui/checkout-view";
import { useCheckoutForm } from "@/modules/checkout/ui/use-checkout-form";
import type { FileComplaintInput } from "@/modules/complaints/application/file-complaint";
import {
  COMPLAINT_KINDS,
  GOOD_TYPES,
  RESPONSE_CHANNELS,
} from "@/modules/complaints/domain/complaint";
import { Button } from "@/shared/ui/atoms/button";
import { FieldError } from "@/shared/ui/atoms/field-error";
import { Input } from "@/shared/ui/atoms/input";
import { Select } from "@/shared/ui/atoms/select";
import { Text } from "@/shared/ui/atoms/text";
import { Textarea } from "@/shared/ui/atoms/textarea";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { FormSection } from "@/shared/ui/molecules/form-section";
import { RadioCards } from "@/shared/ui/molecules/radio-cards";
import { UbigeoFields } from "@/shared/ui/molecules/ubigeo-fields";
import {
  COMPLAINT_BOOK_COPY,
  GOOD_TYPE_LABELS,
  KIND_DEFINITIONS,
  KIND_LABELS,
  FIELD_LABELS as LABELS,
  RESPONSE_CHANNEL_LABELS,
  SECTION_TITLES,
} from "./complaint-copy";
import {
  CHECKED,
  COMPLAINT_FIELDS,
  type ComplaintField,
  type ComplaintFormState,
  type ComplaintFormValues,
  complaintFormSchema,
} from "./complaint-form";

/** `fileComplaintAction` (the Hoja's fields, see COMPLAINT_FIELDS). */
export type FileComplaintAction = (
  state: ComplaintFormState,
  formData: FormData,
) => Promise<ComplaintFormState>;

export type ComplaintSheetFormProps = {
  action: FileComplaintAction;
  /** From `complaintFormInitialState(?pedido=)`, or the server's answer. */
  initialState: ComplaintFormState;
  /** Departamentos, provincias and distritos for the selects. */
  ubigeo: UbigeoTree;
  privacyHref: string;
};

const ID_PREFIX = "hoja";
const RADIO_FIELDS = {
  goodType: GOOD_TYPES[0],
  kind: COMPLAINT_KINDS[0],
  responseChannel: RESPONSE_CHANNELS[0],
} as const;

/** Control ids; a radio group's summary link points at its first option. */
const FIELD_IDS = Object.fromEntries(
  COMPLAINT_FIELDS.map((field) => [
    field,
    field in RADIO_FIELDS
      ? `${ID_PREFIX}-${field}-${RADIO_FIELDS[field as keyof typeof RADIO_FIELDS]}`
      : `${ID_PREFIX}-${field}`,
  ]),
) as Record<ComplaintField, string>;

/**
 * The schema reads checkboxes and radios as unknown (a checkbox gives "si"
 * or false, a radio with nothing chosen null), hence the cast of the options.
 */
const complaintResolver = ((values, context, options) =>
  zodResolver(complaintFormSchema)(
    values,
    context,
    options as never,
  )) as Resolver<ComplaintFormValues, unknown, FileComplaintInput>;

const checkboxClassName =
  "mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function Checkbox({
  id,
  label,
  hint,
  error,
  required = false,
  inputProps,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  inputProps: ComponentProps<"input">;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter((value) => value !== null)
    .join(" ");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <input
          {...inputProps}
          id={id}
          type="checkbox"
          value={CHECKED}
          required={required || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={checkboxClassName}
        />
        <label htmlFor={id} className="text-body text-foreground text-pretty">
          {label}
        </label>
      </div>
      {hint ? (
        <Text id={hintId} size="body-sm" tone="muted" className="text-pretty">
          {hint}
        </Text>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

/**
 * The Hoja de Reclamación (Anexo I, sections 1–3): consumer (with a parent
 * or representative for a minor, revealed with CSS), the good or service,
 * reclamo or queja with their legal definitions, detail, pedido, how to
 * answer, and the declaration. React Hook Form checks it on the client; the
 * form posts to the server action, also without JavaScript (then an
 * "Actualizar provincias y distritos" button reloads the ubigeo options).
 */
export function ComplaintSheetForm({
  action,
  initialState,
  ubigeo,
  privacyHref,
}: ComplaintSheetFormProps) {
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
    resolver: complaintResolver,
    fields: COMPLAINT_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register, setValue, watch } = form;
  const { values, formError } = state;

  const departamento = watch("departamento") ?? "";
  const provincia = watch("provincia") ?? "";
  const options = useMemo(
    () => ubigeoOptions(ubigeo, { departamento, provincia }),
    [ubigeo, departamento, provincia],
  );

  /** Registration, id and the posted value of a text field. */
  function textField(field: ComplaintField) {
    return { ...register(field), defaultValue: values[field] ?? "" };
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={COMPLAINT_BOOK_COPY.formLabel}
      className="flex flex-col gap-8"
    >
      <ErrorSummary
        ref={summaryRef}
        title={formError?.title ?? ERROR_SUMMARY_TITLE}
        message={formError?.message}
        items={summaryItems}
      />

      <FormSection title={SECTION_TITLES.consumer}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={LABELS.firstName}
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
            label={LABELS.lastName}
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
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <FormField
            label={LABELS.documentType}
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
            label={LABELS.documentNumber}
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
                maxLength={20}
              />
            )}
          </FormField>
        </div>
        <FormField
          label={LABELS.email}
          hint={LABELS.emailHint}
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
          label={LABELS.phone}
          hint={LABELS.phoneHint}
          controlId={FIELD_IDS.phone}
          error={errors.phone}
        >
          {(control) => (
            <Input
              {...textField("phone")}
              {...control}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={20}
            />
          )}
        </FormField>
        <FormField
          label={LABELS.addressLine}
          hint={LABELS.addressHint}
          required
          controlId={FIELD_IDS.addressLine}
          error={errors.addressLine}
        >
          {(control) => (
            <Input
              {...textField("addressLine")}
              {...control}
              autoComplete="street-address"
              maxLength={150}
            />
          )}
        </FormField>
        <UbigeoFields
          legend={LABELS.ubigeoLegend}
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
              {LABELS.refreshUbigeoHint}
            </Text>
          }
        />
        <div className="group flex flex-col gap-4">
          <Checkbox
            id={FIELD_IDS.isMinor}
            label={LABELS.isMinor}
            hint={LABELS.isMinorHint}
            inputProps={{
              ...register("isMinor"),
              defaultChecked: values.isMinor === CHECKED,
            }}
          />
          {/*
           * Shown only while "Soy menor de edad" is checked: CSS only, so it
           * works without JavaScript. The id is written out so Tailwind sees
           * the class (FIELD_IDS.isMinor is "hoja-isMinor").
           */}
          <fieldset className="hidden flex-col gap-4 rounded-lg border p-4 group-has-[#hoja-isMinor:checked]:flex">
            <legend className="px-1 text-body-sm font-medium text-foreground">
              {LABELS.guardianLegend}
            </legend>
            <FormField
              label={LABELS.guardianName}
              required
              controlId={FIELD_IDS.guardianName}
              error={errors.guardianName}
            >
              {(control) => (
                <Input
                  {...textField("guardianName")}
                  {...control}
                  autoComplete="off"
                  maxLength={120}
                />
              )}
            </FormField>
            <FormField
              label={LABELS.guardianAddress}
              controlId={FIELD_IDS.guardianAddress}
              error={errors.guardianAddress}
            >
              {(control) => (
                <Input
                  {...textField("guardianAddress")}
                  {...control}
                  autoComplete="off"
                  maxLength={150}
                />
              )}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={LABELS.guardianPhone}
                controlId={FIELD_IDS.guardianPhone}
                error={errors.guardianPhone}
              >
                {(control) => (
                  <Input
                    {...textField("guardianPhone")}
                    {...control}
                    type="tel"
                    autoComplete="off"
                    inputMode="tel"
                    maxLength={20}
                  />
                )}
              </FormField>
              <FormField
                label={LABELS.guardianEmail}
                controlId={FIELD_IDS.guardianEmail}
                error={errors.guardianEmail}
              >
                {(control) => (
                  <Input
                    {...textField("guardianEmail")}
                    {...control}
                    type="email"
                    autoComplete="off"
                    inputMode="email"
                    spellCheck={false}
                    maxLength={254}
                  />
                )}
              </FormField>
            </div>
          </fieldset>
        </div>
      </FormSection>

      <FormSection title={SECTION_TITLES.goods}>
        <RadioCards
          legend={LABELS.goodType}
          name="goodType"
          idPrefix={`${ID_PREFIX}-goodType`}
          columns={2}
          required
          defaultValue={values.goodType}
          error={errors.goodType}
          inputProps={register("goodType")}
          options={GOOD_TYPES.map((type) => ({
            value: type,
            label: GOOD_TYPE_LABELS[type],
          }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={LABELS.orderNumber}
            hint={LABELS.orderNumberHint}
            controlId={FIELD_IDS.orderNumber}
            error={errors.orderNumber}
          >
            {(control) => (
              <Input
                {...textField("orderNumber")}
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
            label={LABELS.amount}
            hint={LABELS.amountHint}
            controlId={FIELD_IDS.amount}
            error={errors.amount}
          >
            {(control) => (
              <Input
                {...textField("amount")}
                {...control}
                inputMode="decimal"
                autoComplete="off"
                maxLength={16}
              />
            )}
          </FormField>
        </div>
        <FormField
          label={LABELS.goodDescription}
          hint={LABELS.goodDescriptionHint}
          controlId={FIELD_IDS.goodDescription}
          error={errors.goodDescription}
        >
          {(control) => (
            <Input
              {...textField("goodDescription")}
              {...control}
              autoComplete="off"
              maxLength={500}
            />
          )}
        </FormField>
      </FormSection>

      <FormSection title={SECTION_TITLES.claim}>
        <RadioCards
          legend={LABELS.kind}
          name="kind"
          idPrefix={`${ID_PREFIX}-kind`}
          required
          defaultValue={values.kind}
          error={errors.kind}
          inputProps={register("kind")}
          options={COMPLAINT_KINDS.map((kind) => ({
            value: kind,
            label: KIND_LABELS[kind],
            description: KIND_DEFINITIONS[kind],
          }))}
        />
        <FormField
          label={LABELS.detail}
          hint={LABELS.detailHint}
          required
          controlId={FIELD_IDS.detail}
          error={errors.detail}
        >
          {(control) => (
            <Textarea
              {...textField("detail")}
              {...control}
              rows={6}
              maxLength={4000}
            />
          )}
        </FormField>
        <FormField
          label={LABELS.request}
          hint={LABELS.requestHint}
          controlId={FIELD_IDS.request}
          error={errors.request}
        >
          {(control) => (
            <Textarea
              {...textField("request")}
              {...control}
              rows={4}
              maxLength={2000}
            />
          )}
        </FormField>
        <RadioCards
          legend={LABELS.responseChannel}
          name="responseChannel"
          idPrefix={`${ID_PREFIX}-responseChannel`}
          columns={2}
          required
          defaultValue={values.responseChannel}
          error={errors.responseChannel}
          inputProps={register("responseChannel")}
          options={RESPONSE_CHANNELS.map((channel) => ({
            value: channel,
            label: RESPONSE_CHANNEL_LABELS[channel],
          }))}
        />
      </FormSection>

      <div className="flex flex-col gap-4">
        <Checkbox
          id={FIELD_IDS.acceptDeclaration}
          label={LABELS.acceptDeclaration}
          error={errors.acceptDeclaration}
          required
          inputProps={{
            ...register("acceptDeclaration"),
            defaultChecked: values.acceptDeclaration === CHECKED,
          }}
        />
        <Text size="body-sm" tone="muted" className="text-pretty">
          {LABELS.privacy}{" "}
          <Link
            href={privacyHref}
            className="underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {LABELS.privacyLink}
          </Link>
          .
        </Text>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* First submit button: Enter in a field sends the Hoja. */}
        <Button type="submit" size="lg" loading={pending}>
          {LABELS.submit}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="ubigeo"
          variant="secondary"
          size="lg"
          className="hidden noscript:inline-flex"
        >
          {LABELS.refreshUbigeo}
        </Button>
      </div>
    </form>
  );
}
