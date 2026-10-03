"use client";

import { ChevronDown } from "lucide-react";
import { type ChangeEvent, type FormEvent, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { inputClassName } from "@/shared/ui/atoms/input";
import { Label } from "@/shared/ui/atoms/label";

export type SortOption = { value: string; label: string };

export type SortSelectProps = {
  /** GET target: the listing URL without its query. */
  action: string;
  /** Field name, e.g. "orden". */
  name: string;
  options: readonly SortOption[];
  /** The current sort; must be one of `options`. */
  value: string;
  /** Visible label. Defaults to "Ordenar por". */
  label?: string;
  /** Submitted with the sort, e.g. the current filters. */
  hiddenFields?: readonly { name: string; value: string }[];
  /** Client navigation: receives the fields instead of a full GET. */
  onApply?: (params: URLSearchParams) => void;
  className?: string;
};

/**
 * Sort menu as a native GET form: a labelled `<select>` plus the hidden fields
 * to keep. Changing it applies the sort at once (with `onApply` on the client,
 * otherwise as a native submit). When scripting is off, an "Ordenar" button
 * submits it. Give it a `key` that changes with the URL so it follows it.
 */
export function SortSelect({
  action,
  name,
  options,
  value,
  label = "Ordenar por",
  hiddenFields = [],
  onApply,
  className,
}: SortSelectProps) {
  if (!options.some((option) => option.value === value)) {
    throw new RangeError(
      `SortSelect value "${value}" is not one of its options`,
    );
  }
  const selectId = useId();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onApply === undefined) return;
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [field, fieldValue] of new FormData(event.currentTarget)) {
      if (typeof fieldValue === "string") params.append(field, fieldValue);
    }
    onApply(params);
  }

  return (
    <form
      action={action}
      method="get"
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
    >
      {hiddenFields.map(({ name: field, value: fieldValue }) => (
        <input
          key={`${field}=${fieldValue}`}
          type="hidden"
          name={field}
          value={fieldValue}
        />
      ))}
      <Label
        htmlFor={selectId}
        className="shrink-0 font-normal text-muted-foreground"
      >
        {label}
      </Label>
      <div className="relative min-w-0">
        <select
          id={selectId}
          name={name}
          defaultValue={value}
          onChange={handleChange}
          className={cn(inputClassName, "cursor-pointer appearance-none pr-10")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="hidden noscript:inline-flex"
      >
        Ordenar
      </Button>
    </form>
  );
}
