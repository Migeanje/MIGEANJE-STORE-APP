import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

export const inputClassName = [
  // 44px tall: the mobile touch target.
  "h-11 w-full min-w-0 rounded-md border border-input bg-card px-4",
  "font-sans text-body text-foreground placeholder:text-muted-foreground",
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // Errors use `destructive`; the FieldError text carries the meaning.
  "aria-invalid:border-destructive",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

export type InputProps = ComponentProps<"input">;

/**
 * Native text input (text, email, tel, search...). Forwards every native prop
 * and the ref. Label it with `Label`; wiring `aria-invalid` and
 * `aria-describedby` to a `FieldError` is the FormField molecule's job.
 */
export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      {...props}
      type={type ?? "text"}
      className={cn(inputClassName, className)}
    />
  );
}
