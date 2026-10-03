// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  CONTACT_FIELDS,
  contactFormSchema,
  fieldErrorsOf,
  type PaymentFormValues,
  paymentFormSchema,
  readFormValues,
  receiptFormSchema,
} from "./checkout-forms";

const CONTACT = {
  email: " Ana@Correo.PE ",
  firstName: "Ana",
  lastName: "Pérez Quispe",
  documentType: "dni",
  documentNumber: "46027897",
  phone: "+51 987 654 321",
  addressLine: "Av. Larco 1234, dpto. 501",
  addressReference: "Frente al parque",
  departamento: "15",
  provincia: "1501",
  distrito: "150122",
};

function errorsOf(
  schema: { safeParse: (v: unknown) => unknown },
  values: object,
) {
  const result = schema.safeParse(values) as {
    success: boolean;
    error?: Parameters<typeof fieldErrorsOf>[0];
  };
  return result.success || !result.error ? {} : fieldErrorsOf(result.error);
}

describe("readFormValues", () => {
  it("reads the named fields as strings, empty when missing or a file", () => {
    const data = new FormData();
    data.set("email", "ana@correo.pe");
    data.set("phone", new Blob(["x"]));
    expect(readFormValues(data, ["email", "phone", "firstName"])).toEqual({
      email: "ana@correo.pe",
      phone: "",
      firstName: "",
    });
  });
});

describe("contactFormSchema", () => {
  it("normalizes a valid contact into the step input", () => {
    expect(contactFormSchema.parse(CONTACT)).toEqual({
      customer: {
        firstName: "Ana",
        lastName: "Pérez Quispe",
        email: "ana@correo.pe",
        phone: "987654321",
        document: { type: "dni", number: "46027897" },
      },
      address: {
        line: "Av. Larco 1234, dpto. 501",
        reference: "Frente al parque",
        ubigeo: { departamento: "15", provincia: "1501", distrito: "150122" },
      },
    });
  });

  it("asks for every required field in Spanish", () => {
    const empty = Object.fromEntries(
      CONTACT_FIELDS.map((field) => [field, ""]),
    );
    expect(errorsOf(contactFormSchema, empty)).toEqual({
      email: "Escribe tu correo electrónico.",
      firstName: "Escribe tus nombres.",
      lastName: "Escribe tus apellidos.",
      documentType: "Elige el tipo de documento.",
      documentNumber: "Escribe el número de tu documento.",
      phone: "Escribe tu celular.",
      addressLine: "Escribe tu dirección.",
      departamento: "Elige tu departamento.",
      provincia: "Elige tu provincia.",
      distrito: "Elige tu distrito.",
    });
  });

  it("explains a malformed email, phone or document", () => {
    expect(
      errorsOf(contactFormSchema, {
        ...CONTACT,
        email: "ana@",
        phone: "4441234",
        documentNumber: "1234",
      }),
    ).toEqual({
      email: "Revisa tu correo: debe ser como nombre@correo.com.",
      phone: "Escribe un celular de 9 dígitos que empiece con 9.",
      documentNumber: "El DNI tiene 8 dígitos.",
    });
    expect(
      errorsOf(contactFormSchema, {
        ...CONTACT,
        documentType: "ce",
        documentNumber: "1234",
      }),
    ).toEqual({
      documentNumber:
        "El carné de extranjería tiene de 9 a 12 letras o números.",
    });
  });

  it("accepts a CE typed in lowercase with spaces", () => {
    expect(
      contactFormSchema.parse({
        ...CONTACT,
        documentType: "ce",
        documentNumber: "ab 1234567",
      }).customer.document,
    ).toEqual({ type: "ce", number: "AB1234567" });
  });

  it("refuses a provincia or distrito of another parent", () => {
    expect(
      errorsOf(contactFormSchema, {
        ...CONTACT,
        provincia: "0401",
        distrito: "040101",
      }),
    ).toEqual({
      provincia: "Esa provincia no es del departamento que elegiste.",
    });
    expect(
      errorsOf(contactFormSchema, { ...CONTACT, distrito: "150501" }),
    ).toEqual({ distrito: "Ese distrito no es de la provincia que elegiste." });
  });

  it("limits long texts", () => {
    expect(
      errorsOf(contactFormSchema, {
        ...CONTACT,
        addressLine: "x".repeat(151),
        addressReference: "x".repeat(151),
      }),
    ).toEqual({
      addressLine: "Usa 150 caracteres como máximo.",
      addressReference: "Usa 150 caracteres como máximo.",
    });
  });
});

describe("receiptFormSchema", () => {
  const factura = {
    receiptType: "factura",
    ruc: "20131312955",
    businessName: "Empresa Demo S.A.C.",
    fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
  };

  it("reads a boleta and ignores factura fields", () => {
    expect(
      receiptFormSchema({ facturaEnabled: false }).parse({
        receiptType: "boleta",
        ruc: "junk",
        businessName: "",
        fiscalAddress: "",
      }),
    ).toEqual({ type: "boleta" });
  });

  it("refuses a factura while facturas are disabled", () => {
    expect(
      errorsOf(receiptFormSchema({ facturaEnabled: false }), factura),
    ).toEqual({ receiptType: "Por ahora solo emitimos boletas." });
  });

  it("reads a factura when enabled", () => {
    expect(receiptFormSchema({ facturaEnabled: true }).parse(factura)).toEqual({
      type: "factura",
      ruc: "20131312955",
      businessName: "Empresa Demo S.A.C.",
      fiscalAddress: "Av. Garcilaso de la Vega 1472, Lima",
    });
  });

  it("explains invalid factura data", () => {
    expect(
      errorsOf(receiptFormSchema({ facturaEnabled: true }), {
        ...factura,
        ruc: "20131312954",
        businessName: " ",
        fiscalAddress: "",
      }),
    ).toEqual({
      ruc: "Revisa el RUC: el último dígito no coincide.",
      businessName: "Escribe la razón social.",
      fiscalAddress: "Escribe la dirección fiscal.",
    });
    expect(
      errorsOf(receiptFormSchema({ facturaEnabled: true }), {
        ...factura,
        ruc: "123",
      }),
    ).toEqual({ ruc: "El RUC tiene 11 dígitos y empieza con 10 o 20." });
  });

  it("asks to choose a receipt type", () => {
    expect(
      errorsOf(receiptFormSchema({ facturaEnabled: true }), {
        ...factura,
        receiptType: "",
      }),
    ).toEqual({ receiptType: "Elige el tipo de comprobante." });
  });
});

describe("paymentFormSchema", () => {
  const now = new Date("2026-10-03T15:00:00Z");
  const card: PaymentFormValues = {
    cardNumber: "4111 1111 1111 1111",
    cardExpiry: "12/30",
    cardCvv: "123",
    cardHolder: " Ana Pérez ",
    acceptTerms: "si",
  };

  it("reads a valid card", () => {
    expect(paymentFormSchema(now).parse(card)).toEqual({
      number: "4111111111111111",
      expiry: { month: 12, year: 2030 },
      cvv: "123",
      holderName: "Ana Pérez",
    });
  });

  it("asks for every field and the terms", () => {
    expect(
      errorsOf(paymentFormSchema(now), {
        cardNumber: "",
        cardExpiry: "",
        cardCvv: "",
        cardHolder: "",
        acceptTerms: "",
      }),
    ).toEqual({
      cardNumber: "Escribe el número de tu tarjeta.",
      cardExpiry: "Escribe el vencimiento como MM/AA.",
      cardCvv: "El CVV tiene 3 o 4 dígitos.",
      cardHolder: "Escribe el nombre como aparece en la tarjeta.",
      acceptTerms: "Acepta los términos y condiciones para continuar.",
    });
  });

  it("checks the Luhn digit, the expiry and the CVV", () => {
    expect(
      errorsOf(paymentFormSchema(now), {
        ...card,
        cardNumber: "4111 1111 1111 1112",
        cardExpiry: "09/26",
        cardCvv: "12a",
      }),
    ).toEqual({
      cardNumber: "Revisa el número de tu tarjeta.",
      cardExpiry: "Tu tarjeta está vencida.",
      cardCvv: "El CVV tiene 3 o 4 dígitos.",
    });
    expect(
      errorsOf(paymentFormSchema(now), { ...card, cardExpiry: "13/30" }),
    ).toEqual({ cardExpiry: "Escribe el vencimiento como MM/AA." });
  });

  it("accepts the terms from a checkbox library value too", () => {
    expect(
      paymentFormSchema(now).safeParse({ ...card, acceptTerms: true }).success,
    ).toBe(true);
    expect(
      paymentFormSchema(now).safeParse({ ...card, acceptTerms: false }).success,
    ).toBe(false);
  });
});
