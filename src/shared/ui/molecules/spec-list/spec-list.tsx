import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { textVariants } from "@/shared/ui/atoms/text";

export type Spec = {
  /** Spec name, e.g. "Potencia máxima". Unique within the list (used as key). */
  label: string;
  /** Data value, e.g. 65 or "2 × USB-C, 1 × USB-A". */
  value: ReactNode;
  /** Unit after the value, e.g. "W", joined with a no-break space. */
  unit?: string;
};

const listVariants = cva("", {
  variants: {
    variant: {
      // Product page and comparator: one spec per row, label | value.
      full: "divide-y divide-border",
      // Cards and quick views: a two-column grid of label-over-value cells.
      compact: "grid grid-cols-2 gap-x-4 gap-y-3",
    },
  },
  defaultVariants: { variant: "full" },
});

const rowVariants = cva("", {
  variants: {
    variant: {
      full: "grid grid-cols-2 gap-4 py-3",
      compact: "flex min-w-0 flex-col gap-0.5",
    },
  },
  defaultVariants: { variant: "full" },
});

export type SpecListVariant = NonNullable<
  VariantProps<typeof listVariants>["variant"]
>;

export type SpecListProps = Omit<ComponentProps<"dl">, "children"> & {
  specs: readonly Spec[];
  /** `full` (default): rows with dividers. `compact`: two-column grid. */
  variant?: SpecListVariant;
};

/** Labels key the rows: a repeated label is a data bug, so fail loudly. */
function assertUniqueLabels(specs: readonly Spec[]): void {
  const seen = new Set<string>();
  for (const { label } of specs) {
    if (seen.has(label)) {
      throw new Error(`SpecList labels must be unique, got "${label}" twice`);
    }
    seen.add(label);
  }
}

/**
 * Product specs as a `<dl>`: muted labels, values (and units) in Geist Mono.
 * Renders nothing without specs. Throws an Error when two specs share a label.
 */
export function SpecList({
  specs,
  variant = "full",
  className,
  ...props
}: SpecListProps) {
  if (specs.length === 0) return null;
  assertUniqueLabels(specs);

  const termClassName = textVariants({
    size: variant === "compact" ? "caption" : "body-sm",
    tone: "muted",
  });
  const definitionClassName = textVariants({
    size: "body-sm",
    tone: "default",
    mono: true,
  });

  return (
    <dl
      {...props}
      data-variant={variant}
      className={cn(listVariants({ variant }), className)}
    >
      {specs.map((spec) => (
        <div key={spec.label} className={rowVariants({ variant })}>
          <dt className={termClassName}>{spec.label}</dt>
          <dd className={cn(definitionClassName, "break-words")}>
            {spec.value}
            {spec.unit ? ` ${spec.unit}` : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
