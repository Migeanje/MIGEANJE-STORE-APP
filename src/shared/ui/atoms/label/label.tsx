import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export type LabelProps = ComponentProps<"label"> & {
  /**
   * Shows a decorative asterisk and a visually hidden "(obligatorio)", so the
   * requirement is announced as text, not only as a symbol.
   */
  required?: boolean;
};

/** Native `<label>` for a form field: pass `htmlFor` or nest the control. */
export function Label({
  htmlFor,
  required = false,
  className,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      {...props}
      htmlFor={htmlFor}
      className={cn(
        "inline-block font-sans text-body-sm font-medium text-foreground",
        className,
      )}
    >
      {children}
      {/* The space is a plain text node: name computation trims spans. */}
      {required ? (
        <>
          {" "}
          <span aria-hidden="true" className="text-muted-foreground">
            *
          </span>
          <span className="sr-only">(obligatorio)</span>
        </>
      ) : null}
    </label>
  );
}
