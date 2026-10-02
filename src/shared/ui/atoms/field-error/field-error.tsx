import { CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type FieldErrorProps = Omit<ComponentProps<"p">, "id" | "children"> & {
  /** Required: the field points at it with `aria-describedby`. */
  id: string;
  /** The error message. Nothing renders without one. */
  children?: ReactNode;
};

/**
 * Error message for one form field, in `destructive` with a decorative icon.
 * Renders nothing when there is no message. It does not announce itself: the
 * FormField molecule wires `aria-invalid` and `aria-describedby`.
 */
export function FieldError({
  id,
  className,
  children,
  ...props
}: FieldErrorProps) {
  if (
    children === undefined ||
    children === null ||
    children === false ||
    children === ""
  ) {
    return null;
  }

  return (
    <p
      {...props}
      id={id}
      className={cn(
        "flex items-start gap-1.5 font-sans text-body-sm text-destructive",
        className,
      )}
    >
      {/* 16px icon centered on the first 21px line. */}
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
