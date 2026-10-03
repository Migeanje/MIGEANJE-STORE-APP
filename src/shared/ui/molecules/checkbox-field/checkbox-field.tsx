import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { FieldError } from "@/shared/ui/atoms/field-error";

export type CheckboxFieldProps = Omit<
  ComponentProps<"input">,
  "type" | "id" | "children"
> & {
  /** Control id; the hint and error ids derive from it. */
  id: string;
  /** Visible label (may contain links). */
  label: ReactNode;
  /** Help text, announced as part of the description. */
  hint?: ReactNode;
  /** Error message. Any non-empty node marks the checkbox invalid. */
  error?: ReactNode;
};

/**
 * A native checkbox with its label to the right, an optional hint and an
 * error below. Native, so it posts with the form before (and without)
 * JavaScript. The amber `accent-primary` checkmark is the brand accent.
 */
export function CheckboxField({
  id,
  label,
  hint,
  error,
  className,
  ...props
}: CheckboxFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const hasHint = !isEmptyNode(hint);
  const hasError = !isEmptyNode(error);
  const describedBy =
    [hasHint ? hintId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-3">
        <input
          {...props}
          id={id}
          type="checkbox"
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <label
          htmlFor={id}
          className="text-body-sm text-foreground text-pretty"
        >
          {label}
        </label>
      </div>
      {hasHint ? (
        <p id={hintId} className="pl-8 text-body-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} className="pl-8">
        {error}
      </FieldError>
    </div>
  );
}
