/*
 * Money is stored as integers in minor units (céntimos): S/ 129.90 is 12990.
 * Never do arithmetic on soles as floats.
 */

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

/** Throws a RangeError unless `minor` is a non-negative safe integer. */
export function assertMinorUnits(minor: number): void {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new RangeError(
      `Expected a non-negative integer amount in céntimos, got ${minor}`,
    );
  }
}

/**
 * Formats céntimos as Peruvian soles, e.g. 12990 -> "S/ 129.90" (the space is
 * a no-break space, U+00A0). Throws a RangeError for anything that is not a
 * non-negative safe integer.
 */
export function formatPEN(minor: number): string {
  assertMinorUnits(minor);
  // Integer math plus a decimal string keeps the céntimos exact: Intl formats
  // numeric strings without going through a float (`minor / 100` drifts near
  // MAX_SAFE_INTEGER). `+ 0` turns -0 into 0, so it never prints "-S/".
  const cents = (minor % 100) + 0;
  const soles = (minor - cents) / 100 + 0;
  const decimal =
    `${soles}.${String(cents).padStart(2, "0")}` as Intl.StringNumericLiteral;
  return PEN.format(decimal);
}
