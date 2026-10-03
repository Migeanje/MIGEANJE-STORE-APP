"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, buttonVariants } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { Label } from "@/shared/ui/atoms/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/primitives/sheet";

/** One checkbox. Each carries its own field name (e.g. "marca" or "pantalla"). */
export type FilterCheckboxOption = {
  name: string;
  value: string;
  label: string;
  /** Products with this value; read out as "3 productos". */
  count?: number;
  checked: boolean;
};

export type FilterGroup =
  | {
      kind: "checkboxes";
      legend: string;
      options: readonly FilterCheckboxOption[];
    }
  | {
      kind: "range";
      legend: string;
      unit?: string;
      /** Bounds offered as a hint ("Entre 45 y 160 W"), not enforced. */
      min: number;
      max: number;
      from: { name: string; value?: number };
      to: { name: string; value?: number };
    };

export type HiddenField = { name: string; value: string };

export type FilterPanelProps = {
  /** GET target: the listing URL without its query. */
  action: string;
  groups: readonly FilterGroup[];
  /** Submitted with the filters, e.g. the current sort. */
  hiddenFields?: readonly HiddenField[];
  /** Active filter values: shown on the mobile button. Defaults to 0. */
  activeCount?: number;
  /** "Quitar filtros" target; the link shows while filters are active. */
  clearHref?: string;
  /**
   * Client navigation: receives the non-empty fields instead of a full GET.
   * Without it the form submits natively (as it does before hydration).
   */
  onApply?: (params: URLSearchParams) => void;
  /** Id of the inline panel, the no-JavaScript target of `FilterSheet`. Defaults to "filtros". */
  panelId?: string;
};

const TITLE = "Filtros";
const DEFAULT_PANEL_ID = "filtros";

const NUMBER_FORMAT = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

function productCount(count: number): string {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

function withUnit(value: number, unit?: string): string {
  const number = NUMBER_FORMAT.format(value);
  return unit ? `${number} ${unit}` : number;
}

function CheckboxGroup({
  legend,
  options,
}: Extract<FilterGroup, { kind: "checkboxes" }>) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-2 text-body-sm font-medium text-foreground">
        {legend}
      </legend>
      {options.map((option) => (
        // The whole row is the 44px target; the box is drawn with our tokens.
        <label
          key={`${option.name}=${option.value}`}
          className={cn(
            "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-body-sm text-foreground",
            "transition-colors duration-(--duration-fast) ease-out hover:bg-accent",
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
          )}
        >
          <input
            type="checkbox"
            name={option.name}
            value={option.value}
            defaultChecked={option.checked}
            className="peer sr-only"
          />
          <span
            data-slot="box"
            aria-hidden="true"
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-input bg-card",
              "transition-[background-color,border-color,box-shadow] duration-(--duration-fast) ease-out",
              // "Encendido", and a check mark: shape, not only color.
              "peer-checked:border-primary peer-checked:bg-primary peer-checked:shadow-glow peer-checked:[&>svg]:opacity-100",
            )}
          >
            <Check
              strokeWidth={3}
              className="size-3.5 text-primary-foreground opacity-0"
            />
          </span>
          <span className="flex-1">{option.label}</span>
          {option.count !== undefined ? (
            <>
              <span
                aria-hidden="true"
                className="font-mono text-caption text-muted-foreground"
              >
                {option.count}
              </span>
              <span className="sr-only">, {productCount(option.count)}</span>
            </>
          ) : null}
        </label>
      ))}
    </fieldset>
  );
}

function RangeGroup({
  legend,
  unit,
  min,
  max,
  from,
  to,
}: Extract<FilterGroup, { kind: "range" }>) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const fields = [
    { id: `${baseId}-from`, label: "Desde", field: from, placeholder: min },
    { id: `${baseId}-to`, label: "Hasta", field: to, placeholder: max },
  ];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-body-sm font-medium text-foreground">
        {unit ? `${legend} (${unit})` : legend}
      </legend>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ id, label, field, placeholder }) => (
          <div key={id} className="flex min-w-0 flex-col gap-1">
            <Label htmlFor={id} className="font-normal text-muted-foreground">
              {label}
            </Label>
            <Input
              id={id}
              type="number"
              name={field.name}
              inputMode="decimal"
              step="any"
              min={0}
              defaultValue={field.value}
              placeholder={NUMBER_FORMAT.format(placeholder)}
              aria-describedby={hintId}
              className="px-3 font-mono"
            />
          </div>
        ))}
      </div>
      <p id={hintId} className="font-mono text-caption text-muted-foreground">
        Entre {withUnit(min)} y {withUnit(max, unit)}
      </p>
    </fieldset>
  );
}

type FilterFormProps = Omit<FilterPanelProps, "panelId"> & {
  /** Names the form landmark. */
  name: { labelledBy: string } | { label: string };
};

function FilterForm({
  action,
  groups,
  hiddenFields = [],
  activeCount = 0,
  clearHref,
  onApply,
  name,
}: FilterFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onApply === undefined) return;
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [field, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value.trim() !== "") {
        params.append(field, value.trim());
      }
    }
    onApply(params);
  }

  return (
    <form
      action={action}
      method="get"
      {...("labelledBy" in name
        ? { "aria-labelledby": name.labelledBy }
        : { "aria-label": name.label })}
      onSubmit={handleSubmit}
      className="flex flex-col gap-8"
    >
      {hiddenFields.map(({ name: field, value }) => (
        <input
          key={`${field}=${value}`}
          type="hidden"
          name={field}
          value={value}
        />
      ))}
      {groups.map((group) =>
        group.kind === "range" ? (
          <RangeGroup key={group.legend} {...group} />
        ) : (
          <CheckboxGroup key={group.legend} {...group} />
        ),
      )}
      <div className="flex flex-col gap-2">
        <Button type="submit">Aplicar filtros</Button>
        {clearHref !== undefined && activeCount > 0 ? (
          <Link
            href={clearHref}
            className={buttonVariants({ variant: "ghost" })}
          >
            Quitar filtros
          </Link>
        ) : null}
      </div>
    </form>
  );
}

/**
 * The filters as a native GET form (it works before hydration and without
 * JavaScript; with `onApply` it navigates on the client): checkbox groups
 * with counts under a legend, number ranges with their bounds as a hint, the
 * hidden fields to keep (e.g. the sort), "Aplicar filtros" and "Quitar
 * filtros". A column from `lg`; on phones `FilterSheet` opens the same form
 * in a sheet, and without JavaScript this panel shows when `#filtros` is
 * targeted. Give it a `key` that changes with the URL so the fields follow it.
 */
export function FilterPanel({
  panelId = DEFAULT_PANEL_ID,
  ...props
}: FilterPanelProps) {
  const headingId = useId();
  return (
    <section
      id={panelId}
      aria-labelledby={headingId}
      className="hidden flex-col gap-6 target:flex target:pb-8 lg:flex lg:pb-0"
    >
      <h2
        id={headingId}
        className="font-sans text-title font-medium text-foreground"
      >
        {TITLE}
      </h2>
      <FilterForm {...props} name={{ labelledBy: headingId }} />
    </section>
  );
}

/**
 * Phones: a "Filtros" button (with the active count) that opens the filter
 * form in a sheet; applying closes it. When scripting is off the button is
 * replaced by a link to the inline `FilterPanel` (`#filtros`).
 */
export function FilterSheet({
  panelId = DEFAULT_PANEL_ID,
  onApply,
  ...props
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = props.activeCount ?? 0;

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="secondary"
            leadingIcon={<SlidersHorizontal />}
            className="noscript:hidden"
          >
            {TITLE}
            {activeCount > 0 ? (
              <>
                <span className="sr-only">, {activeCount} activos</span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1 font-mono text-caption text-primary-foreground"
                >
                  {activeCount}
                </span>
              </>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          closeLabel="Cerrar filtros"
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>{TITLE}</SheetTitle>
          </SheetHeader>
          <FilterForm
            {...props}
            name={{ label: TITLE }}
            onApply={
              onApply === undefined
                ? undefined
                : (params) => {
                    setOpen(false);
                    onApply(params);
                  }
            }
          />
        </SheetContent>
      </Sheet>
      <a
        href={`#${panelId}`}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "hidden noscript:inline-flex",
        )}
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {TITLE}
      </a>
    </div>
  );
}
