import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { inputClassName } from "@/shared/ui/atoms/input";

export type TextareaProps = ComponentProps<"textarea">;

/**
 * Native multi-line text field with the Input's look (card surface, `input`
 * border, amber focus ring, destructive border while `aria-invalid`), at
 * least 128px tall and resizable vertically. Forwards every native prop and
 * the ref; FormField wires its label, hint and error.
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(inputClassName, "h-auto min-h-32 resize-y py-3", className)}
    />
  );
}
