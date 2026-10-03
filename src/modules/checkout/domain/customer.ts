import * as z from "zod";

/*
 * Who buys: a guest customer in Peru (accounts arrive later). Identity
 * documents for a boleta are the DNI (Peruvians) or the carné de extranjería
 * (CE). Schemas here describe valid, already normalized data; user input goes
 * through the normalizers first (forms clean it, the domain never guesses).
 */

/** DNI: 8 digits. */
export const DNI_PATTERN = /^\d{8}$/;
/** Carné de extranjería: 9 to 12 uppercase letters or digits. */
export const CE_PATTERN = /^[A-Z0-9]{9,12}$/;
/** A Peruvian mobile number without the +51 prefix: 9 digits starting with 9. */
export const MOBILE_PATTERN = /^9\d{8}$/;
/** RUC: 11 digits, 10 (persona natural) or 20 (persona jurídica) first. */
export const RUC_PATTERN = /^(10|20)\d{9}$/;

export const DOCUMENT_TYPES = ["dni", "ce"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// SUNAT's module 11 weights for the first 10 digits of a RUC.
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/**
 * True for a RUC starting with 10 or 20 whose last digit is SUNAT's check
 * digit: 11 − (Σ digit × weight mod 11), where 10 becomes 0 and 11 becomes 1.
 */
export function isValidRuc(ruc: string): boolean {
  if (!RUC_PATTERN.test(ruc)) return false;
  const digits = [...ruc].map(Number);
  const sum = RUC_WEIGHTS.reduce(
    (total, weight, index) => total + weight * (digits[index] as number),
    0,
  );
  const check = (11 - (sum % 11)) % 10;
  return check === digits[10];
}

/** Trims and lowercases an email address. */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * The digits of a phone number, without a leading +51 (or 51) when what
 * remains is a 9-digit mobile number.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("519")
    ? digits.slice(2)
    : digits;
}

/** Uppercases a document number and drops its whitespace. */
export function normalizeDocumentNumber(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

export const identityDocumentSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("dni"),
    number: z.string().regex(DNI_PATTERN, "Expected a DNI of 8 digits"),
  }),
  z.strictObject({
    type: z.literal("ce"),
    number: z
      .string()
      .regex(
        CE_PATTERN,
        "Expected a CE of 9 to 12 uppercase letters or digits",
      ),
  }),
]);

export const personNameSchema = z.string().trim().min(1).max(60);

export const customerSchema = z.strictObject({
  firstName: personNameSchema,
  lastName: personNameSchema,
  /** Normalized (lowercase): it identifies the guest's orders. */
  email: z
    .email()
    .max(254)
    .refine((email) => email === normalizeEmail(email), {
      message: "Expected a normalized (trimmed, lowercase) email",
    }),
  /** Mobile number without +51, for the courier. */
  phone: z.string().regex(MOBILE_PATTERN, "Expected a Peruvian mobile number"),
  document: identityDocumentSchema,
});

export type IdentityDocument = z.infer<typeof identityDocumentSchema>;
export type Customer = z.infer<typeof customerSchema>;
