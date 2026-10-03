import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { FieldError } from "@/shared/ui/atoms/field-error";

export type RadioCardOption = {
  value: string;
  /** The option's accessible name. */
  label: ReactNode;
  /** Announced as the option's description (e.g. a definition). */
  description?: ReactNode;
};

export type RadioCardsProps = Omit<
  ComponentProps<"fieldset">,
  "children" | "defaultValue"
> & {
  legend: ReactNode;
  /** The field name every radio posts. */
  name: string;
  options: readonly RadioCardOption[];
  /** Checked on the first render; the radios are uncontrolled. */
  defaultValue?: string;
  error?: ReactNode;
  /** Shows the legend marker and makes the radios required. */
  required?: boolean;
  /**
   * Radio ids are `${idPrefix}-${value}`: link an error summary to the first
   * option's id. Generated with `useId` when omitted.
   */
  idPrefix?: string;
  /** Extra props for every radio, e.g. a form library's registration. */
  inputProps?: Omit<
    ComponentProps<"input">,
    "type" | "id" | "value" | "defaultChecked" | "checked"
  >;
  /** Cards per row from the `sm` breakpoint. Defaults to 1. */
  columns?: 1 | 2;
};

const radioClassName =
  "mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * A choice between a few options shown as cards: native radios (they post
 * without JavaScript and move with the arrow keys) inside a fieldset whose
 * legend names the group. Each whole card selects its option; the option's
 * label is its name and the description (e.g. a legal definition) its
 * description. The checked card gets the amber border.
 */
export function RadioCards({
  legend,
  name,
  options,
  defaultValue,
  error,
  required = false,
  idPrefix,
  inputProps = {},
  columns = 1,
  className,
  ...props
}: RadioCardsProps) {
  const generatedPrefix = useId();
  const prefix = idPrefix || generatedPrefix;
  const errorId = `${prefix}-error`;
  const hasError = !isEmptyNode(error);

  return (
    <fieldset
      {...props}
      aria-describedby={hasError ? errorId : undefined}
      className={cn("flex flex-col gap-3", className)}
    >
      <legend className="mb-3 font-sans text-body-sm font-medium text-foreground">
        {legend}
        {required ? (
          <>
            {" "}
            <span aria-hidden="true" className="text-muted-foreground">
              *
            </span>
            <span className="sr-only">(obligatorio)</span>
          </>
        ) : null}
      </legend>
      <div
        className={cn("grid gap-3", columns === 2 ? "sm:grid-cols-2" : null)}
      >
        {options.map((option) => {
          const id = `${prefix}-${option.value}`;
          const labelId = `${id}-label`;
          const descriptionId = `${id}-description`;
          const hasDescription = !isEmptyNode(option.description);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 transition-[border-color] duration-(--duration-fast) ease-out hover:border-input has-checked:border-primary"
            >
              <input
                name={name}
                {...inputProps}
                id={id}
                type="radio"
                value={option.value}
                defaultChecked={defaultValue === option.value}
                required={required || undefined}
                aria-invalid={hasError || undefined}
                aria-labelledby={labelId}
                aria-describedby={hasDescription ? descriptionId : undefined}
                className={radioClassName}
              />
              <span className="flex flex-col gap-1">
                <span id={labelId} className="text-body text-foreground">
                  {option.label}
                </span>
                {hasDescription ? (
                  <span
                    id={descriptionId}
                    className="text-body-sm text-muted-foreground text-pretty"
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </fieldset>
  );
}
