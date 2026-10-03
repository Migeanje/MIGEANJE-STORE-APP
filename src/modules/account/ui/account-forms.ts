import * as z from "zod";
import { failedPasswordRules } from "@/modules/account/domain/password-policy";
import {
  MOBILE_PATTERN,
  normalizeEmail,
  normalizePhone,
} from "@/modules/checkout/domain/customer";
import type { UbigeoCodes } from "@/modules/checkout/domain/ubigeo";
import { CONTACT_MESSAGES as CONTACT } from "@/modules/checkout/ui/checkout-copy";
import type { FormState } from "@/modules/checkout/ui/checkout-forms";
import { ACCOUNT_MESSAGES, passwordRulesMessage } from "./account-copy";

/*
 * The account forms at the UI boundary: flat string fields validated with the
 * same Zod schemas on the client (React Hook Form) and in the server actions,
 * with Spanish messages. Each schema turns valid input into what the use
 * case takes.
 */

export const LOG_IN_FIELDS = ["email", "password"] as const;
export type LogInField = (typeof LOG_IN_FIELDS)[number];
export type LogInFormState = FormState<LogInField>;

export const REGISTER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "password",
  "acceptTerms",
] as const;
export type RegisterField = (typeof REGISTER_FIELDS)[number];
export type RegisterFormState = FormState<RegisterField>;

export const RECOVER_FIELDS = ["email"] as const;
export type RecoverField = (typeof RECOVER_FIELDS)[number];
export type RecoverFormState = FormState<RecoverField>;

export const PROFILE_FIELDS = ["firstName", "lastName", "phone"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type ProfileFormState = FormState<ProfileField>;

export const ADDRESS_FIELDS = [
  "addressId",
  "label",
  "addressLine",
  "addressReference",
  "departamento",
  "provincia",
  "distrito",
  "makeDefault",
] as const;
export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type AddressFormState = FormState<AddressField>;

const emailFormat = z.email();

const emailField = z
  .string()
  .trim()
  .min(1, CONTACT.emailRequired)
  .max(254, CONTACT.emailInvalid)
  .refine(
    (email) => emailFormat.safeParse(normalizeEmail(email)).success,
    CONTACT.emailInvalid,
  )
  .transform(normalizeEmail);

const firstNameField = z
  .string()
  .trim()
  .min(1, CONTACT.firstNameRequired)
  .max(60, CONTACT.nameTooLong);

const lastNameField = z
  .string()
  .trim()
  .min(1, CONTACT.lastNameRequired)
  .max(60, CONTACT.nameTooLong);

/** Optional mobile: blank is none (null). */
const optionalPhoneField = z
  .string()
  .transform(normalizePhone)
  .pipe(
    z
      .string()
      .refine(
        (phone) => phone === "" || MOBILE_PATTERN.test(phone),
        CONTACT.phoneInvalid,
      ),
  )
  .transform((phone) => (phone === "" ? null : phone));

/** "si" from the form; `true` from a form library's checkbox. */
const checked = z
  .unknown()
  .transform((value) => value === "si" || value === true);

export const logInFormSchema = z.object({
  email: emailField,
  // As typed (no trimming) and without the rules: older passwords may
  // predate them, and the rules would help guessing.
  password: z.string().min(1, ACCOUNT_MESSAGES.passwordRequired).max(1024),
});

export const registerFormSchema = z
  .object({
    firstName: firstNameField,
    lastName: lastNameField,
    email: emailField,
    phone: optionalPhoneField,
    password: z
      .string()
      .min(1, ACCOUNT_MESSAGES.newPasswordRequired)
      .superRefine((password, ctx) => {
        const failed = failedPasswordRules(password);
        if (failed.length > 0) {
          ctx.addIssue({
            code: "custom",
            message: passwordRulesMessage(failed),
          });
        }
      }),
    acceptTerms: z
      .unknown()
      .refine((value) => value === "si" || value === true, {
        message: ACCOUNT_MESSAGES.termsRequired,
      }),
  })
  .transform(({ acceptTerms: _accepted, ...account }) => account);

export const recoverFormSchema = z.object({ email: emailField });

export const profileFormSchema = z.object({
  firstName: firstNameField,
  lastName: lastNameField,
  phone: optionalPhoneField,
});

const ADDRESS_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type AddressFormInput = {
  /** null for a new address. */
  id: string | null;
  label: string;
  line: string;
  reference: string;
  codes: UbigeoCodes;
  makeDefault: boolean;
};

export const addressFormSchema = z
  .object({
    addressId: z
      .string()
      .refine((id) => id === "" || ADDRESS_ID.test(id), "Unknown address"),
    label: z.string().trim().max(40, ACCOUNT_MESSAGES.labelTooLong),
    addressLine: z
      .string()
      .trim()
      .min(1, CONTACT.addressRequired)
      .max(150, CONTACT.textTooLong),
    addressReference: z.string().trim().max(150, CONTACT.textTooLong),
    departamento: z.string().min(1, CONTACT.departamentoRequired),
    provincia: z.string().min(1, CONTACT.provinciaRequired),
    distrito: z.string().min(1, CONTACT.distritoRequired),
    makeDefault: checked,
  })
  .superRefine(({ departamento, provincia, distrito }, ctx) => {
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
    (values): AddressFormInput => ({
      id: values.addressId === "" ? null : values.addressId,
      label: values.label,
      line: values.addressLine,
      reference: values.addressReference,
      codes: {
        departamento: values.departamento,
        provincia: values.provincia,
        distrito: values.distrito,
      },
      makeDefault: values.makeDefault,
    }),
  );

/**
 * The address values for the no-JavaScript "update provincias y distritos"
 * submit: a provincia or distrito that no longer belongs to the selected
 * parent is dropped, so the page re-renders with the right options.
 */
export function refreshedUbigeoValues(
  values: Record<AddressField, string>,
): Record<AddressField, string> {
  const provincia =
    values.departamento !== "" &&
    values.provincia.startsWith(values.departamento)
      ? values.provincia
      : "";
  const distrito =
    provincia !== "" && values.distrito.startsWith(provincia)
      ? values.distrito
      : "";
  return { ...values, provincia, distrito };
}
