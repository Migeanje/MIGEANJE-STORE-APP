import { Check } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";

export type VariantOptionValue = {
  /** Customer-facing value, e.g. "Negro" or "16 GB". Unique within its group. */
  value: string;
  selected: boolean;
  /** The URL of the variant this value leads to; omit it when it cannot be chosen. */
  href?: string;
  /** Why it cannot be chosen, e.g. "Agotado". Shown under the group. */
  unavailableLabel?: string;
  /** A CSS color for a swatch dot next to the text (the text always stays). */
  swatch?: string;
};

export type VariantOptionGroup = {
  /** Option key, e.g. "color" (used as key). */
  key: string;
  /** Option name, e.g. "Color". Names the group. */
  label: string;
  selectedValue: string;
  values: readonly VariantOptionValue[];
};

export type VariantSelectorProps = Omit<ComponentProps<"div">, "children"> & {
  groups: readonly VariantOptionGroup[];
};

const OPTION_CLASS = [
  // Segmented option: 44px tall, wraps long values ("M5 (CPU de 10 núcleos...)").
  "inline-flex min-h-11 items-center gap-2 rounded-md border px-4 py-2 text-left text-body-sm font-medium",
  "transition-[border-color,color,box-shadow] duration-(--duration-fast) ease-out",
].join(" ");

const LINK_CLASS = [
  OPTION_CLASS,
  "border-border bg-surface-raised text-foreground hover:border-input",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // "Encendido": the selected value lights up in amber, with a check mark.
  "aria-[current=true]:border-primary aria-[current=true]:text-primary aria-[current=true]:shadow-glow",
].join(" ");

const BLOCKED_CLASS = [
  OPTION_CLASS,
  "border-dashed border-border bg-transparent text-muted-foreground line-through",
].join(" ");

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="swatch"
      className="size-4 shrink-0 rounded-full border border-input"
      style={{ backgroundColor: color }}
    />
  );
}

function OptionGroup({ group }: { group: VariantOptionGroup }) {
  const labelId = useId();
  const blocked = group.values.filter(
    (entry) => entry.href === undefined && !entry.selected,
  );

  return (
    <fieldset aria-labelledby={labelId} className="flex min-w-0 flex-col gap-3">
      <p className="text-body-sm text-muted-foreground">
        <span id={labelId}>{group.label}</span>:{" "}
        <span className="text-foreground">{group.selectedValue}</span>
      </p>
      <ul className="flex flex-wrap gap-2">
        {group.values.map((entry) => (
          <li key={entry.value} className="flex">
            {entry.href !== undefined ? (
              <Link
                href={entry.href}
                replace
                scroll={false}
                prefetch={false}
                aria-current={entry.selected ? "true" : undefined}
                className={LINK_CLASS}
              >
                {entry.selected ? (
                  <Check aria-hidden="true" className="size-4 shrink-0" />
                ) : null}
                {entry.swatch ? <Swatch color={entry.swatch} /> : null}
                {entry.value}
              </Link>
            ) : (
              <span className={BLOCKED_CLASS}>
                {entry.swatch ? <Swatch color={entry.swatch} /> : null}
                {entry.value} <span className="sr-only">(no disponible)</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      {blocked.length > 0 ? (
        <ul className="flex flex-col gap-1 text-caption text-muted-foreground">
          {blocked.map((entry) => (
            <li key={entry.value}>
              {entry.value}: {entry.unavailableLabel}
            </li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}

/**
 * The variant options of a product page: one labelled group per option, each
 * value a link to its variant (shareable URLs, works without JavaScript; with
 * it, Next replaces the URL without scrolling). The selected value is
 * `aria-current` with a check mark and the amber light; values that cannot be
 * chosen are not links and say why under the group. Swatches are optional and
 * never the only signal: the value text is always visible.
 */
export function VariantSelector({
  groups,
  className,
  ...props
}: VariantSelectorProps) {
  if (groups.length === 0) return null;
  return (
    <div {...props} className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => (
        <OptionGroup key={group.key} group={group} />
      ))}
    </div>
  );
}
