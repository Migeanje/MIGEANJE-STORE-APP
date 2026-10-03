import * as z from "zod";
import type { ContactInput } from "@/modules/checkout/application/save-contact";
import {
  CE_PATTERN,
  DNI_PATTERN,
  DOCUMENT_TYPES,
  type DocumentType,
  isValidRuc,
  MOBILE_PATTERN,
  normalizeDocumentNumber,
  normalizeEmail,
  normalizePhone,
  RUC_PATTERN,
} from "@/modules/checkout/domain/customer";
import {
  CVV_PATTERN,
  isCardExpired,
  isLuhnValid,
  normalizeCardNumber,
  type PaymentCard,
  parseCardExpiry,
} from "@/modules/checkout/domain/payment-card";
import {
  PAYMENT_QUOTE_FINGERPRINT_PATTERN,
  type PaymentQuote,
} from "@/modules/checkout/domain/payment-quote";
import type { Receipt } from "@/modules/checkout/domain/receipt";
import {
  CONTACT_MESSAGES as CONTACT,
  PAYMENT_MESSAGES as PAYMENT,
  RECEIPT_MESSAGES as RECEIPT,
} from "./checkout-copy";

/*
 * The checkout forms at the UI boundary: flat string fields (what FormData
 * and React Hook Form hold), validated with the same Zod schemas on the
 * client (inline errors) and on the server (authoritative), with Spanish
 * messages. Each schema turns valid input into the domain shape.
 */

export const CONTACT_FIELDS = [
  "email",
  "firstName",
  "lastName",
  "documentType",
  "documentNumber",
  "phone",
  "addressLine",
  "addressReference",
  "departamento",
  "provincia",
  "distrito",
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactFormValues = Record<ContactField, string>;

export const RECEIPT_FIELDS = [
  "receiptType",
  "ruc",
  "businessName",
  "fiscalAddress",
] as const;
export type ReceiptField = (typeof RECEIPT_FIELDS)[number];
export type ReceiptFormValues = Record<ReceiptField, string>;

export const PAYMENT_FIELDS = [
  "cardNumber",
  "cardExpiry",
  "cardCvv",
  "cardHolder",
  "acceptTerms",
] as const;
export type PaymentField = (typeof PAYMENT_FIELDS)[number];
export type PaymentFormValues = Record<PaymentField, string>;

/**
 * Hidden fields of the payment form: the total (céntimos) and fingerprint the
 * page showed (`PaymentQuote`), so the server can refuse a stale page.
 */
export const PAYMENT_QUOTE_FIELDS = {
  total: "expectedTotal",
  fingerprint: "quoteFingerprint",
} as const;

/**
 * What a step form answers (`useActionState`). `values` is sent back so a
 * page rendered without JavaScript keeps what was typed (never card data);
 * `attempt` grows with every failed submit so the form can move focus to its
 * error summary.
 */
export type FormState<F extends string> = {
  values: Partial<Record<F, string>>;
  errors: Partial<Record<F, string>>;
  formError: { title: string; message: string; details?: string[] } | null;
  attempt: number;
};

export function initialFormState<F extends string>(
  values: Partial<Record<F, string>> = {},
): FormState<F> {
  return { values, errors: {}, formError: null, attempt: 0 };
}

/** The named fields as strings ("" when missing or not text). */
export function readFormValues<F extends string>(
  formData: FormData,
  fields: readonly F[],
): Record<F, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<F, string>;
}

/** The first message of each top-level field. */
export function fieldErrorsOf<F extends string>(
  error: z.ZodError,
): Partial<Record<F, string>> {
  const errors: Partial<Record<string, string>> = {};
  for (const issue of error.issues) {
    const [field] = issue.path;
    if (typeof field === "string" && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors as Partial<Record<F, string>>;
}

const emailFormat = z.email();

function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export const contactFormSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, CONTACT.emailRequired)
      .max(254, CONTACT.emailInvalid)
      .refine(
        (email) => emailFormat.safeParse(normalizeEmail(email)).success,
        CONTACT.emailInvalid,
      ),
    firstName: z
      .string()
      .trim()
      .min(1, CONTACT.firstNameRequired)
      .max(60, CONTACT.nameTooLong),
    lastName: z
      .string()
      .trim()
      .min(1, CONTACT.lastNameRequired)
      .max(60, CONTACT.nameTooLong),
    documentType: z
      .string()
      .refine(isDocumentType, CONTACT.documentTypeRequired),
    documentNumber: z.string().trim().min(1, CONTACT.documentNumberRequired),
    phone: z
      .string()
      .trim()
      .min(1, CONTACT.phoneRequired)
      .transform(normalizePhone)
      .pipe(z.string().regex(MOBILE_PATTERN, CONTACT.phoneInvalid)),
    addressLine: z
      .string()
      .trim()
      .min(1, CONTACT.addressRequired)
      .max(150, CONTACT.textTooLong),
    addressReference: z.string().trim().max(150, CONTACT.textTooLong),
    departamento: z.string().min(1, CONTACT.departamentoRequired),
    provincia: z.string().min(1, CONTACT.provinciaRequired),
    distrito: z.string().min(1, CONTACT.distritoRequired),
  })
  .superRefine((values, ctx) => {
    const number = normalizeDocumentNumber(values.documentNumber);
    if (number !== "" && values.documentType === "dni") {
      if (!DNI_PATTERN.test(number)) {
        ctx.addIssue({
          code: "custom",
          message: CONTACT.dniInvalid,
          path: ["documentNumber"],
        });
      }
    } else if (number !== "" && values.documentType === "ce") {
      if (!CE_PATTERN.test(number)) {
        ctx.addIssue({
          code: "custom",
          message: CONTACT.ceInvalid,
          path: ["documentNumber"],
        });
      }
    }
    const { departamento, provincia, distrito } = values;
    if (departamento && provincia && !provincia.startsWith(departamento)) {
      ctx.addIssue({
        code: "custom",
        message: CONTACT.provinciaMismatch,
        path: ["provincia"],
      });
    } else if (provincia && distrito && !distrito.startsWith(provincia)) {
      ctx.addIssue({
        code: "custom",
        message: CONTACT.distritoMismatch,
        path: ["distrito"],
      });
    }
  })
  .transform(
    (values): ContactInput => ({
      customer: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: normalizeEmail(values.email),
        phone: values.phone,
        document: {
          type: values.documentType as DocumentType,
          number: normalizeDocumentNumber(values.documentNumber),
        },
      },
      address: {
        line: values.addressLine,
        reference: values.addressReference,
        ubigeo: {
          departamento: values.departamento,
          provincia: values.provincia,
          distrito: values.distrito,
        },
      },
    }),
  );

/** The receipt step; facturas only while the `factura` flag is on. */
export function receiptFormSchema({
  facturaEnabled,
}: {
  facturaEnabled: boolean;
}) {
  return z
    .object({
      receiptType: z.string(),
      ruc: z.string().trim(),
      businessName: z.string().trim(),
      fiscalAddress: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      const issue = (path: ReceiptField, message: string) =>
        ctx.addIssue({ code: "custom", message, path: [path] });

      if (values.receiptType !== "boleta" && values.receiptType !== "factura") {
        issue("receiptType", RECEIPT.typeRequired);
        return;
      }
      if (values.receiptType === "boleta") return;
      if (!facturaEnabled) {
        issue("receiptType", RECEIPT.facturaDisabled);
        return;
      }
      if (!RUC_PATTERN.test(values.ruc)) issue("ruc", RECEIPT.rucFormat);
      else if (!isValidRuc(values.ruc)) issue("ruc", RECEIPT.rucCheckDigit);
      if (values.businessName === "") {
        issue("businessName", RECEIPT.businessNameRequired);
      } else if (values.businessName.length > 150) {
        issue("businessName", RECEIPT.textTooLong);
      }
      if (values.fiscalAddress === "") {
        issue("fiscalAddress", RECEIPT.fiscalAddressRequired);
      } else if (values.fiscalAddress.length > 200) {
        issue("fiscalAddress", RECEIPT.textTooLong);
      }
    })
    .transform(
      (values): Receipt =>
        values.receiptType === "factura"
          ? {
              type: "factura",
              ruc: values.ruc,
              businessName: values.businessName,
              fiscalAddress: values.fiscalAddress,
            }
          : { type: "boleta" },
    );
}

/** The card form; `now` decides whether the card has expired. */
export function paymentFormSchema(now: Date) {
  return z
    .object({
      cardNumber: z
        .string()
        .transform(normalizeCardNumber)
        .pipe(
          z
            .string()
            .min(1, PAYMENT.cardNumberRequired)
            .refine(isLuhnValid, PAYMENT.cardNumberInvalid),
        ),
      cardExpiry: z
        .string()
        .refine(
          (expiry) => parseCardExpiry(expiry) !== null,
          PAYMENT.expiryInvalid,
        )
        .refine((expiry) => {
          const parsed = parseCardExpiry(expiry);
          return parsed === null || !isCardExpired(parsed, now);
        }, PAYMENT.expired),
      cardCvv: z.string().trim().regex(CVV_PATTERN, PAYMENT.cvvInvalid),
      cardHolder: z
        .string()
        .trim()
        .min(1, PAYMENT.holderRequired)
        .max(60, PAYMENT.holderTooLong),
      // "si" from the form; `true` from a form library's checkbox.
      acceptTerms: z
        .unknown()
        .refine((value) => value === "si" || value === true, {
          message: PAYMENT.termsRequired,
        }),
    })
    .transform(
      (values): PaymentCard => ({
        number: values.cardNumber,
        // Valid here: the refinements above passed.
        expiry: parseCardExpiry(values.cardExpiry) as PaymentCard["expiry"],
        cvv: values.cardCvv,
        holderName: values.cardHolder,
      }),
    );
}

const paymentQuoteFormSchema = z.strictObject({
  total: z
    .string()
    .regex(/^\d{1,15}$/)
    .transform(Number)
    .pipe(z.int().min(1)),
  fingerprint: z.string().regex(PAYMENT_QUOTE_FINGERPRINT_PATTERN),
});

/** The quote the payment page posted; null when it is missing or malformed. */
export function readPaymentQuote(formData: FormData): PaymentQuote | null {
  const parsed = paymentQuoteFormSchema.safeParse({
    total: formData.get(PAYMENT_QUOTE_FIELDS.total) ?? "",
    fingerprint: formData.get(PAYMENT_QUOTE_FIELDS.fingerprint) ?? "",
  });
  return parsed.success ? parsed.data : null;
}
