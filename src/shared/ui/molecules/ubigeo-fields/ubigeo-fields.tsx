import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Select } from "@/shared/ui/atoms/select";
import { FormField } from "@/shared/ui/molecules/form-field";

export type UbigeoOption = { code: string; name: string };
export type UbigeoLevel = "departamento" | "provincia" | "distrito";

export type UbigeoFieldsProps = Omit<ComponentProps<"fieldset">, "children"> & {
  /** Defaults to "Ubicación". */
  legend?: ReactNode;
  departamentos: readonly UbigeoOption[];
  /** The provincias of the selected departamento (empty before one). */
  provincias: readonly UbigeoOption[];
  /** The distritos of the selected provincia (empty before one). */
  distritos: readonly UbigeoOption[];
  /** Codes selected on the first render ("" for none); the selects are uncontrolled. */
  defaultValues?: Partial<Record<UbigeoLevel, string>>;
  errors?: Partial<Record<UbigeoLevel, ReactNode>>;
  /**
   * Extra props per select, e.g. a form library's registration (name, ref,
   * onChange, onBlur). The field names default to the level names.
   */
  selectProps?: Partial<Record<UbigeoLevel, ComponentProps<"select">>>;
  /** Control ids are `${idPrefix}-departamento` and so on. */
  idPrefix?: string;
  /**
   * Shown after the selects, e.g. a submit button that reloads the options
   * when JavaScript is off (it cannot filter them as you pick).
   */
  refreshControl?: ReactNode;
};

const LEVELS: readonly {
  level: UbigeoLevel;
  label: string;
  placeholder: string;
  emptyPlaceholder: string;
}[] = [
  {
    level: "departamento",
    label: "Departamento",
    placeholder: "Elige un departamento",
    emptyPlaceholder: "No hay departamentos",
  },
  {
    level: "provincia",
    label: "Provincia",
    placeholder: "Elige una provincia",
    emptyPlaceholder: "Primero elige un departamento",
  },
  {
    level: "distrito",
    label: "Distrito",
    placeholder: "Elige un distrito",
    emptyPlaceholder: "Primero elige una provincia",
  },
];

/**
 * Departamento, provincia and distrito of a Peruvian address as three native
 * selects (they submit without JavaScript). The options come from the
 * caller, who filters them as the customer picks; values are INEI codes.
 */
export function UbigeoFields({
  legend = "Ubicación",
  departamentos,
  provincias,
  distritos,
  defaultValues = {},
  errors = {},
  selectProps = {},
  idPrefix,
  refreshControl,
  className,
  ...props
}: UbigeoFieldsProps) {
  const generatedPrefix = useId();
  const prefix = idPrefix || generatedPrefix;
  const options: Record<UbigeoLevel, readonly UbigeoOption[]> = {
    departamento: departamentos,
    provincia: provincias,
    distrito: distritos,
  };

  return (
    <fieldset {...props} className={cn("flex flex-col gap-4", className)}>
      <legend className="mb-4 text-body font-medium text-foreground">
        {legend}
      </legend>
      <div className="grid gap-4 sm:grid-cols-3">
        {LEVELS.map(({ level, label, placeholder, emptyPlaceholder }) => {
          const choices = options[level];
          return (
            <FormField
              key={level}
              label={label}
              required
              controlId={`${prefix}-${level}`}
              error={errors[level]}
            >
              {(control) => (
                <Select
                  name={level}
                  defaultValue={defaultValues[level] ?? ""}
                  {...selectProps[level]}
                  {...control}
                >
                  <option value="">
                    {choices.length === 0 ? emptyPlaceholder : placeholder}
                  </option>
                  {choices.map((choice) => (
                    <option key={choice.code} value={choice.code}>
                      {choice.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormField>
          );
        })}
      </div>
      {refreshControl}
    </fieldset>
  );
}
