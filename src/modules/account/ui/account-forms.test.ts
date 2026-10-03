// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fieldErrorsOf } from "@/modules/checkout/ui/checkout-forms";
import {
  addressFormSchema,
  logInFormSchema,
  profileFormSchema,
  recoverFormSchema,
  registerFormSchema,
} from "./account-forms";

function errorsOf(result: { success: boolean; error?: unknown }) {
  if (result.success) return {};
  return fieldErrorsOf(result.error as Parameters<typeof fieldErrorsOf>[0]);
}

describe("logInFormSchema", () => {
  it("normalizes the email and keeps the password as typed", () => {
    expect(
      logInFormSchema.parse({ email: " Demo@Migeanje.pe ", password: " x " }),
    ).toEqual({ email: "demo@migeanje.pe", password: " x " });
  });

  it("asks for both fields, without the password rules", () => {
    expect(
      errorsOf(logInFormSchema.safeParse({ email: "", password: "" })),
    ).toEqual({
      email: "Escribe tu correo electrónico.",
      password: "Escribe tu contraseña.",
    });
    expect(
      errorsOf(logInFormSchema.safeParse({ email: "demo", password: "1" })),
    ).toEqual({ email: "Revisa tu correo: debe ser como nombre@correo.com." });
  });
});

describe("registerFormSchema", () => {
  const VALID = {
    firstName: " Luis ",
    lastName: "Rojas",
    email: "Luis@Correo.pe",
    phone: "",
    password: "Otra-clave-2",
    acceptTerms: "si",
  };

  it("turns the form into the new account's data", () => {
    expect(registerFormSchema.parse(VALID)).toEqual({
      firstName: "Luis",
      lastName: "Rojas",
      email: "luis@correo.pe",
      phone: null,
      password: "Otra-clave-2",
    });
    expect(
      registerFormSchema.parse({ ...VALID, phone: "+51 987 654 321" }).phone,
    ).toBe("987654321");
  });

  it("says which password rules are missing", () => {
    expect(
      errorsOf(registerFormSchema.safeParse({ ...VALID, password: "corta" })),
    ).toEqual({
      password:
        "Tu contraseña necesita: entre 8 y 128 caracteres y al menos un número.",
    });
    expect(
      errorsOf(registerFormSchema.safeParse({ ...VALID, password: "" })),
    ).toEqual({ password: "Crea una contraseña." });
  });

  it("asks for the names, a valid mobile and the terms", () => {
    expect(
      errorsOf(
        registerFormSchema.safeParse({
          ...VALID,
          firstName: "",
          lastName: " ",
          phone: "123",
          acceptTerms: "",
        }),
      ),
    ).toEqual({
      firstName: "Escribe tus nombres.",
      lastName: "Escribe tus apellidos.",
      phone: "Escribe un celular de 9 dígitos que empiece con 9.",
      acceptTerms:
        "Acepta los términos y la política de privacidad para crear tu cuenta.",
    });
  });
});

describe("recoverFormSchema", () => {
  it("needs a valid email", () => {
    expect(recoverFormSchema.parse({ email: "A@b.pe" })).toEqual({
      email: "a@b.pe",
    });
    expect(errorsOf(recoverFormSchema.safeParse({ email: "" }))).toEqual({
      email: "Escribe tu correo electrónico.",
    });
  });
});

describe("profileFormSchema", () => {
  it("keeps an empty phone as none", () => {
    expect(
      profileFormSchema.parse({
        firstName: "Ana",
        lastName: "Pérez",
        phone: " ",
      }),
    ).toEqual({ firstName: "Ana", lastName: "Pérez", phone: null });
  });
});

describe("addressFormSchema", () => {
  const VALID = {
    addressId: "",
    label: "Casa",
    addressLine: "Av. Larco 1234",
    addressReference: "",
    departamento: "15",
    provincia: "1501",
    distrito: "150122",
    makeDefault: "si",
  };

  it("turns the form into an address input (codes resolved later)", () => {
    expect(addressFormSchema.parse(VALID)).toEqual({
      id: null,
      label: "Casa",
      line: "Av. Larco 1234",
      reference: "",
      codes: { departamento: "15", provincia: "1501", distrito: "150122" },
      makeDefault: true,
    });
    expect(
      addressFormSchema.parse({
        ...VALID,
        addressId: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
        makeDefault: "",
      }),
    ).toMatchObject({
      id: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
      makeDefault: false,
    });
  });

  it("asks for the street and a place that nests", () => {
    expect(
      errorsOf(
        addressFormSchema.safeParse({
          ...VALID,
          addressLine: "",
          provincia: "0401",
          label: "x".repeat(41),
        }),
      ),
    ).toEqual({
      addressLine: "Escribe tu dirección.",
      provincia: "Esa provincia no es del departamento que elegiste.",
      label: "Usa 40 caracteres como máximo.",
    });
  });

  it("refuses an address id that is not one", () => {
    expect(
      addressFormSchema.safeParse({ ...VALID, addressId: "../x" }).success,
    ).toBe(false);
  });
});
