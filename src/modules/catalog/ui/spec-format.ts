import type {
  ResolvedSpec,
  SpecKind,
  SpecValue,
} from "@/modules/catalog/domain/category";
import type { Spec } from "@/shared/ui/molecules/spec-list";

const NUMBER_FORMAT = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

/**
 * A spec value as customer text: numbers in es-PE ("300,000"), booleans as
 * "Sí"/"No", lists joined with commas, texts as they are. The unit is not
 * included. A value that does not fit its kind (a data bug the catalog schema
 * already rejects) falls back to its plain text instead of failing the page.
 */
export function formatSpecValue({
  kind,
  value,
}: {
  kind: SpecKind;
  value: SpecValue;
}): string {
  if (kind === "number" && typeof value === "number") {
    return NUMBER_FORMAT.format(value);
  }
  if (kind === "boolean" && typeof value === "boolean") {
    return value ? "Sí" : "No";
  }
  return Array.isArray(value) ? value.join(", ") : String(value);
}

/** The product page spec rows (SpecList `full`), with units on numbers. */
export function toSpecListItems(specs: readonly ResolvedSpec[]): Spec[] {
  return specs.map((spec) => {
    const value = formatSpecValue(spec);
    return spec.kind === "number" && spec.unit !== undefined
      ? { label: spec.label, value, unit: spec.unit }
      : { label: spec.label, value };
  });
}
