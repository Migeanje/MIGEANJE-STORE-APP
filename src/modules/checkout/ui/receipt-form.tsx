"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { Text } from "@/shared/ui/atoms/text";
import { ErrorSummary } from "@/shared/ui/molecules/error-summary";
import { FormField } from "@/shared/ui/molecules/form-field";
import { ERROR_SUMMARY_TITLE } from "./checkout-copy";
import {
  type FormState,
  RECEIPT_FIELDS,
  type ReceiptField,
  receiptFormSchema,
} from "./checkout-forms";
import { useCheckoutForm } from "./use-checkout-form";

export type ReceiptFormProps = {
  action: (
    state: FormState<ReceiptField>,
    formData: FormData,
  ) => Promise<FormState<ReceiptField>>;
  initialState: FormState<ReceiptField>;
  /** The `factura` feature flag (off under Nuevo RUS). */
  facturaEnabled: boolean;
  /** Who the boleta is issued to: "Ana Pérez", "DNI 46027897", email. */
  boletaFor: { name: string; document: string; email: string };
};

const FIELD_IDS: Record<ReceiptField, string> = {
  receiptType: "checkout-receipt-boleta",
  ruc: "checkout-ruc",
  businessName: "checkout-business-name",
  fiscalAddress: "checkout-fiscal-address",
};

const radioClassName =
  "mt-1 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function BoletaDetails({ boletaFor }: Pick<ReceiptFormProps, "boletaFor">) {
  return (
    <Text size="body-sm" tone="muted" className="text-pretty">
      A nombre de {boletaFor.name} · {boletaFor.document}. Te la enviamos a{" "}
      {boletaFor.email}.
    </Text>
  );
}

/**
 * Step 2: the comprobante. While facturas are disabled it confirms the
 * boleta (issued to the contact step's document). With the flag on, a radio
 * picks boleta or factura and the factura fields show only for factura (pure
 * CSS, so it also works without JavaScript).
 */
export function ReceiptForm({
  action,
  initialState,
  facturaEnabled,
  boletaFor,
}: ReceiptFormProps) {
  const resolver = useMemo(
    () => zodResolver(receiptFormSchema({ facturaEnabled })),
    [facturaEnabled],
  );
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
    resolver,
    fields: RECEIPT_FIELDS,
    fieldIds: FIELD_IDS,
  });
  const { register } = form;
  const values = state.values;
  const selected = values.receiptType === "factura" ? "factura" : "boleta";

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

      {facturaEnabled ? (
        <fieldset
          className="group flex flex-col gap-4"
          aria-describedby={
            errors.receiptType ? `${FIELD_IDS.receiptType}-error` : undefined
          }
        >
          <legend className="mb-4 text-body font-medium text-foreground">
            Tipo de comprobante
          </legend>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 has-checked:border-primary">
            <input
              {...register("receiptType")}
              id={FIELD_IDS.receiptType}
              type="radio"
              value="boleta"
              defaultChecked={selected === "boleta"}
              className={radioClassName}
            />
            <span className="flex flex-col gap-1">
              <span className="text-body text-foreground">
                Boleta de venta electrónica
              </span>
              <BoletaDetails boletaFor={boletaFor} />
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 has-checked:border-primary">
            <input
              {...register("receiptType")}
              id="checkout-receipt-factura"
              type="radio"
              value="factura"
              defaultChecked={selected === "factura"}
              className={radioClassName}
            />
            <span className="flex flex-col gap-1">
              <span className="text-body text-foreground">
                Factura electrónica
              </span>
              <Text as="span" size="body-sm" tone="muted">
                Para empresas o personas con RUC.
              </Text>
            </span>
          </label>
          {errors.receiptType ? (
            <p
              id={`${FIELD_IDS.receiptType}-error`}
              className="text-body-sm text-destructive"
            >
              {errors.receiptType}
            </p>
          ) : null}
          {/* Shown only while "Factura" is checked (CSS, no JavaScript needed). */}
          <div
            className={cn(
              "hidden flex-col gap-4 group-has-[#checkout-receipt-factura:checked]:flex",
            )}
          >
            <FormField
              label="RUC"
              hint="11 dígitos, empieza con 10 o 20."
              required
              controlId={FIELD_IDS.ruc}
              error={errors.ruc}
            >
              {(control) => (
                <Input
                  {...register("ruc")}
                  defaultValue={values.ruc ?? ""}
                  {...control}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                />
              )}
            </FormField>
            <FormField
              label="Razón social"
              required
              controlId={FIELD_IDS.businessName}
              error={errors.businessName}
            >
              {(control) => (
                <Input
                  {...register("businessName")}
                  defaultValue={values.businessName ?? ""}
                  {...control}
                  autoComplete="organization"
                />
              )}
            </FormField>
            <FormField
              label="Dirección fiscal"
              required
              controlId={FIELD_IDS.fiscalAddress}
              error={errors.fiscalAddress}
            >
              {(control) => (
                <Input
                  {...register("fiscalAddress")}
                  defaultValue={values.fiscalAddress ?? ""}
                  {...control}
                />
              )}
            </FormField>
          </div>
        </fieldset>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-5">
          <input
            {...register("receiptType")}
            id={FIELD_IDS.receiptType}
            type="hidden"
            value="boleta"
          />
          <Text className="font-medium">Boleta de venta electrónica</Text>
          <BoletaDetails boletaFor={boletaFor} />
          <Text size="body-sm" tone="muted" className="text-pretty">
            Por ahora emitimos solo boletas de venta electrónicas.
          </Text>
        </div>
      )}

      <div>
        <Button type="submit" size="lg" loading={pending}>
          Continuar al pago
        </Button>
      </div>
    </form>
  );
}
