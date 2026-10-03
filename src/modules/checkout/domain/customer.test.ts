// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  customerSchema,
  identityDocumentSchema,
  isValidRuc,
  normalizeDocumentNumber,
  normalizeEmail,
  normalizePhone,
} from "./customer";

describe("isValidRuc", () => {
  it("accepts RUCs starting with 10 or 20 whose check digit matches", () => {
    // SUNAT's own RUC.
    expect(isValidRuc("20131312955")).toBe(true);
    // A person with business (RUC 10 = 10 + DNI + check digit).
    expect(isValidRuc("10460278975")).toBe(true);
  });

  it("maps a remainder of 10 to check digit 0 and 11 to check digit 1", () => {
    expect(isValidRuc("20000000010")).toBe(true);
    expect(isValidRuc("20000000061")).toBe(true);
    expect(isValidRuc("20000000001")).toBe(true);
  });

  it("rejects a wrong check digit, another prefix or another length", () => {
    expect(isValidRuc("20131312954")).toBe(false);
    expect(isValidRuc("30131312955")).toBe(false);
    expect(isValidRuc("2013131295")).toBe(false);
    expect(isValidRuc("201313129550")).toBe(false);
    expect(isValidRuc("2013131295A")).toBe(false);
  });
});

describe("normalizers", () => {
  it("trims and lowercases emails", () => {
    expect(normalizeEmail("  Ana.Perez@Correo.PE ")).toBe(
      "ana.perez@correo.pe",
    );
  });

  it("keeps the 9 digits of a Peruvian mobile, with or without +51", () => {
    expect(normalizePhone("987 654 321")).toBe("987654321");
    expect(normalizePhone("+51 987-654-321")).toBe("987654321");
    expect(normalizePhone("51987654321")).toBe("987654321");
    expect(normalizePhone("(01) 4441234")).toBe("014441234");
  });

  it("uppercases document numbers without spaces", () => {
    expect(normalizeDocumentNumber(" ab 123 4567 ")).toBe("AB1234567");
  });
});

describe("identityDocumentSchema", () => {
  it("accepts a DNI of 8 digits", () => {
    expect(
      identityDocumentSchema.parse({ type: "dni", number: "46027897" }),
    ).toEqual({ type: "dni", number: "46027897" });
  });

  it.each(["4602789", "460278971", "4602789A"])(
    "rejects the DNI %s",
    (number) => {
      expect(
        identityDocumentSchema.safeParse({ type: "dni", number }).success,
      ).toBe(false);
    },
  );

  it.each(["001234567", "AB1234567890"])("accepts the CE %s", (number) => {
    expect(
      identityDocumentSchema.safeParse({ type: "ce", number }).success,
    ).toBe(true);
  });

  it.each(["00123456", "AB12345678901", "ab1234567", "00-123456"])(
    "rejects the CE %s",
    (number) => {
      expect(
        identityDocumentSchema.safeParse({ type: "ce", number }).success,
      ).toBe(false);
    },
  );

  it("rejects other document types", () => {
    expect(
      identityDocumentSchema.safeParse({ type: "ruc", number: "20131312955" })
        .success,
    ).toBe(false);
  });
});

describe("customerSchema", () => {
  const customer = {
    firstName: "Ana",
    lastName: "Pérez Quispe",
    email: "ana@correo.pe",
    phone: "987654321",
    document: { type: "dni", number: "46027897" },
  };

  it("accepts a guest customer", () => {
    expect(customerSchema.parse(customer)).toEqual(customer);
  });

  it("requires a Peruvian mobile of 9 digits starting with 9", () => {
    expect(
      customerSchema.safeParse({ ...customer, phone: "014441234" }).success,
    ).toBe(false);
    expect(
      customerSchema.safeParse({ ...customer, phone: "98765432" }).success,
    ).toBe(false);
  });

  it("requires a lowercase email and non-empty names", () => {
    expect(
      customerSchema.safeParse({ ...customer, email: "Ana@correo.pe" }).success,
    ).toBe(false);
    expect(
      customerSchema.safeParse({ ...customer, email: "ana@" }).success,
    ).toBe(false);
    expect(
      customerSchema.safeParse({ ...customer, firstName: "  " }).success,
    ).toBe(false);
  });
});
