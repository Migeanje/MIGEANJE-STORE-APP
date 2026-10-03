import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { FieldError } from "@/shared/ui/atoms/field-error";
import { Input } from "@/shared/ui/atoms/input";
import { Label } from "@/shared/ui/atoms/label";
import { Text } from "@/shared/ui/atoms/text";

/** Props FormField computes for its control. Spread them on the control. */
export type FormFieldControlProps = {
  id: string;
  /** Hint and error ids, only when they render. */
  "aria-describedby"?: string;
  /** Set only while there is an error message. */
  "aria-invalid"?: true;
  /** Native constraint for inputs, selects and textareas. */
  required?: true;
  /** The same requirement for custom controls (e.g. a combobox button). */
  "aria-required"?: true;
};

export type FormFieldProps = Omit<ComponentProps<"div">, "children"> & {
  /** Visible label text. */
  label: ReactNode;
  /** Help text below the control, announced as its description. */
  hint?: ReactNode;
  /** Error message. Any non-empty node marks the control invalid. */
  error?: ReactNode;
  /** Shows the Label marker and marks the control required. */
  required?: boolean;
  /** Id for the control. Generated with `useId` when omitted or empty. */
  controlId?: string;
  /**
   * Renders the control from the computed props. Defaults to an `Input`:
   * `{(control) => <Input {...control} type="email" />}`.
   */
  children?: (control: FormFieldControlProps) => ReactNode;
};

function renderInput(control: FormFieldControlProps) {
  return <Input {...control} />;
}

/**
 * Label + control + optional hint + FieldError, wired for assistive tech:
 * `htmlFor`/`id`, `aria-describedby` (hint, then error), `aria-invalid` and
 * the required state. The control comes from a render prop, so any control
 * gets the same typed props and keeps its own props in plain sight.
 */
export function FormField({
  label,
  hint,
  error,
  required = false,
  controlId,
  className,
  children = renderInput,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  // An empty id would break htmlFor and the hint/error ids: treat it as absent.
  const id = controlId || generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasHint = !isEmptyNode(hint);
  const hasError = !isEmptyNode(error);

  const describedBy = [hasHint ? hintId : null, hasError ? errorId : null]
    .filter((value) => value !== null)
    .join(" ");

  const control: FormFieldControlProps = {
    id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": hasError || undefined,
    required: required || undefined,
    "aria-required": required || undefined,
  };

  return (
    <div {...props} className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children(control)}
      {hasHint ? (
        <Text id={hintId} size="body-sm" tone="muted">
          {hint}
        </Text>
      ) : null}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
