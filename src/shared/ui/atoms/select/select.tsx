import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { inputClassName } from "@/shared/ui/atoms/input";

export type SelectProps = ComponentProps<"select">;

/**
 * Native `<select>` with the Input styles and a decorative chevron. Native on
 * purpose: it submits with the form before hydration and without JavaScript,
 * and phones show their own picker. Forwards every native prop and the ref;
 * `className` goes to the select. Label it with `Label` or wrap it in
 * FormField.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className={cn(
          inputClassName,
          "cursor-pointer appearance-none truncate pr-10",
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
