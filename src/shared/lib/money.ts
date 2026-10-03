/*
 * Money is stored as integers in minor units (céntimos): S/ 129.90 is 12990.
 * Never do arithmetic on soles as floats.
 */

// The symbol "S/", the no-break space and the "," / "." separators come from
// the runtime's ICU data for es-PE (full ICU ships with Node and browsers).
// money.test.ts guards it: "runtime ICU provides es-PE PEN formatting".
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
  // Intl formats numeric strings without going through a float, so the
  // céntimos stay exact (`minor / 100` drifts near MAX_SAFE_INTEGER).
  return PEN.format(toDecimalAmount(minor) as Intl.StringNumericLiteral);
}

/**
 * Céntimos as a plain decimal string in soles, e.g. 12990 -> "129.90": the
 * format of machine-readable prices (schema.org offers, payment APIs). Integer
 * math only. Throws a RangeError like `formatPEN`.
 */
export function toDecimalAmount(minor: number): string {
  assertMinorUnits(minor);
  // `+ 0` turns -0 into 0, so it never prints "-0.00".
  const cents = (minor % 100) + 0;
  const soles = (minor - cents) / 100 + 0;
  return `${soles}.${String(cents).padStart(2, "0")}`;
}
