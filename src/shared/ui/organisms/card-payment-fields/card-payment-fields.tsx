import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { FieldError } from "@/shared/ui/atoms/field-error";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "@/shared/ui/molecules/form-field";

export type CardField = "number" | "expiry" | "cvv" | "holder";
export type CardPaymentField = CardField | "terms";

export type CardPaymentFieldsProps = Omit<
  ComponentProps<"fieldset">,
  "children"
> & {
  /** Control ids are `${idPrefix}-number`, `-expiry`, `-cvv`, `-holder`, `-terms`. */
  idPrefix: string;
  /** Defaults to "Datos de tu tarjeta". */
  legend?: ReactNode;
  /** Where the terms of purchase live. */
  termsHref: string;
  /** Simulated payment: shows the test cards. Defaults to true. */
  demo?: boolean;
  errors?: Partial<Record<CardPaymentField, ReactNode>>;
  /**
   * Extra props per control, e.g. a form library's registration (name, ref,
   * onChange, onBlur). Names default to cardNumber, cardExpiry, cardCvv,
   * cardHolder and acceptTerms.
   */
  inputProps?: Partial<Record<CardPaymentField, ComponentProps<"input">>>;
};

const FIELDS: readonly {
  field: CardField;
  label: string;
  name: string;
  hint?: string;
  attributes: ComponentProps<"input">;
  className?: string;
}[] = [
  {
    field: "number",
    label: "Número de tarjeta",
    name: "cardNumber",
    attributes: {
      autoComplete: "cc-number",
      inputMode: "numeric",
      placeholder: "1234 5678 9012 3456",
      maxLength: 23,
    },
    className: "sm:col-span-2",
  },
  {
    field: "expiry",
    label: "Vencimiento (MM/AA)",
    name: "cardExpiry",
    attributes: {
      autoComplete: "cc-exp",
      inputMode: "numeric",
      placeholder: "MM/AA",
      maxLength: 7,
    },
  },
  {
    field: "cvv",
    label: "CVV",
    name: "cardCvv",
    hint: "3 o 4 dígitos, al reverso de tu tarjeta.",
    attributes: { autoComplete: "cc-csc", inputMode: "numeric", maxLength: 4 },
  },
  {
    field: "holder",
    label: "Nombre en la tarjeta",
    name: "cardHolder",
    attributes: { autoComplete: "cc-name", autoCapitalize: "characters" },
    className: "sm:col-span-2",
  },
];

/** DRAFT copy: the simulated payment until Culqi (F4). */
function DemoBanner() {
  const titleId = useId();
  return (
    <div
      role="note"
      aria-labelledby={titleId}
      className="flex gap-3 rounded-lg border border-primary bg-surface-raised p-4"
    >
      <FlaskConical
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-primary"
      />
      <div className="flex flex-col gap-1 text-body-sm text-foreground">
        <p id={titleId} className="font-medium">
          Modo demostración
        </p>
        <p className="text-pretty">
          No se hará ningún cargo. Paga con la tarjeta de prueba{" "}
          <span className="font-mono whitespace-nowrap">
            4111 1111 1111 1111
          </span>{" "}
          (cualquier fecha futura y CVV). Para ver un pago rechazado, usa{" "}
          <span className="font-mono whitespace-nowrap">
            4000 0000 0000 0002
          </span>
          . No escribas los datos de una tarjeta real.
        </p>
      </div>
    </div>
  );
}

/**
 * The card part of the payment step: the demo banner (simulated payment),
 * card number, expiry, CVV and holder with payment autocomplete hints and
 * numeric keyboards, and the terms checkbox linking to the terms. Plain
 * inputs: the form around them decides validation and submission.
 */
export function CardPaymentFields({
  idPrefix,
  legend = "Datos de tu tarjeta",
  termsHref,
  demo = true,
  errors = {},
  inputProps = {},
  className,
  ...props
}: CardPaymentFieldsProps) {
  const termsId = `${idPrefix}-terms`;
  const termsErrorId = `${termsId}-error`;
  const termsError = errors.terms;
  const hasTermsError = !isEmptyNode(termsError);

  return (
    <fieldset {...props} className={cn("flex flex-col gap-5", className)}>
      <legend className="mb-5 text-body font-medium text-foreground">
        {legend}
      </legend>
      {demo ? <DemoBanner /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ field, label, name, hint, attributes, className }) => (
          <FormField
            key={field}
            label={label}
            hint={hint}
            required
            controlId={`${idPrefix}-${field}`}
            error={errors[field]}
            className={className}
          >
            {(control) => (
              <Input
                name={name}
                spellCheck={false}
                {...attributes}
                {...inputProps[field]}
                {...control}
              />
            )}
          </FormField>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            name="acceptTerms"
            value="si"
            {...inputProps.terms}
            id={termsId}
            type="checkbox"
            required
            aria-required
            aria-invalid={hasTermsError || undefined}
            aria-describedby={hasTermsError ? termsErrorId : undefined}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <label
            htmlFor={termsId}
            className="text-body-sm text-foreground text-pretty"
          >
            Acepto los{" "}
            <Link
              href={termsHref}
              className="underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              términos y condiciones de compra
            </Link>
          </label>
        </div>
        <FieldError id={termsErrorId}>{termsError}</FieldError>
      </div>
    </fieldset>
  );
}
