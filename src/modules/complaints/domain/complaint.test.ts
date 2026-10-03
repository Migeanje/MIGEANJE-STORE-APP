// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  aComplaintSheet,
  aNewComplaint,
  FILED_AT,
} from "@/modules/complaints/testing/complaint-builders";
import {
  COMPLAINT_NUMBER_PATTERN,
  complaintSheetSchema,
  complaintYear,
  formatComplaintNumber,
  newComplaintSchema,
  RESPONSE_BUSINESS_DAYS,
  responseDueDate,
} from "./complaint";

describe("complaint numbers", () => {
  it("follows Anexo I: a 9-digit correlative, then the year", () => {
    expect(formatComplaintNumber(2026, 1)).toBe("000000001-2026");
    expect(formatComplaintNumber(2026, 999_999_999)).toBe("999999999-2026");
    expect(COMPLAINT_NUMBER_PATTERN.test("000000001-2026")).toBe(true);
    expect(COMPLAINT_NUMBER_PATTERN.test("MG-2026-000001")).toBe(false);
    expect(COMPLAINT_NUMBER_PATTERN.test("1-2026")).toBe(false);
  });

  it("refuses a year without 4 digits or a sequence outside 1–999999999", () => {
    expect(() => formatComplaintNumber(26, 1)).toThrow(RangeError);
    expect(() => formatComplaintNumber(2026, 0)).toThrow(RangeError);
    expect(() => formatComplaintNumber(2026, 1_000_000_000)).toThrow(
      RangeError,
    );
    expect(() => formatComplaintNumber(2026, 1.5)).toThrow(RangeError);
  });

  it("numbers by the year in Lima (UTC−5)", () => {
    // 2027-01-01 03:00 UTC is still 31 Dec 2026 in Lima.
    expect(complaintYear(new Date("2027-01-01T03:00:00Z"))).toBe(2026);
    expect(complaintYear(new Date("2027-01-01T05:00:00Z"))).toBe(2027);
  });
});

describe("responseDueDate", () => {
  it("is 15 business days (not extendable) after the filing date in Lima", () => {
    expect(RESPONSE_BUSINESS_DAYS).toBe(15);
    // Saturday 3 Oct 2026 -> Friday 23 Oct 2026 (weekends skipped).
    expect(responseDueDate(new Date("2026-10-03T15:00:00Z"))).toBe(
      "2026-10-23",
    );
    // Monday 5 Oct 2026 -> Monday 26 Oct 2026.
    expect(responseDueDate(new Date("2026-10-05T15:00:00Z"))).toBe(
      "2026-10-26",
    );
  });

  it("counts from the Lima date of a late-night filing", () => {
    // Friday 2 Oct 2026, 11 p.m. in Lima (04:00 UTC on Saturday).
    expect(responseDueDate(new Date("2026-10-03T04:00:00Z"))).toBe(
      "2026-10-23",
    );
  });
});

describe("complaintSheetSchema", () => {
  it("accepts a complete sheet", () => {
    expect(complaintSheetSchema.parse(aComplaintSheet())).toEqual(
      aComplaintSheet(),
    );
  });

  it("requires the consumer's declaration", () => {
    const sheet = { ...aComplaintSheet(), declarationAccepted: false };
    expect(complaintSheetSchema.safeParse(sheet).success).toBe(false);
  });

  it("refuses a due date that does not follow the rule", () => {
    const sheet = { ...aComplaintSheet(), responseDueDate: "2026-11-30" };
    const result = complaintSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["responseDueDate"]);
  });

  it("refuses a number of another year than the filing", () => {
    const sheet = { ...aComplaintSheet(), number: "000000001-2025" };
    const result = complaintSheetSchema.safeParse(sheet);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["number"]);
  });

  it("refuses an order number that is not ours", () => {
    const sheet = aComplaintSheet();
    const bad = { ...sheet, goods: { ...sheet.goods, orderNumber: "123" } };
    expect(complaintSheetSchema.safeParse(bad).success).toBe(false);
  });

  it("keeps the claimed amount in céntimos (integers only)", () => {
    const sheet = aComplaintSheet();
    const fraction = { ...sheet, goods: { ...sheet.goods, amount: 12.5 } };
    expect(complaintSheetSchema.safeParse(fraction).success).toBe(false);
    const none = { ...sheet, goods: { ...sheet.goods, amount: null } };
    expect(complaintSheetSchema.safeParse(none).success).toBe(true);
  });

  it("needs a normalized email and a valid identity document", () => {
    const sheet = aComplaintSheet();
    const upper = {
      ...sheet,
      consumer: { ...sheet.consumer, email: "Ana@Correo.pe" },
    };
    expect(complaintSheetSchema.safeParse(upper).success).toBe(false);
    const badDni = {
      ...sheet,
      consumer: {
        ...sheet.consumer,
        document: { type: "dni", number: "123" },
      },
    };
    expect(complaintSheetSchema.safeParse(badDni).success).toBe(false);
  });

  it("records a parent or representative for a minor", () => {
    const sheet = aComplaintSheet();
    const guardian = {
      fullName: "Rosa Quispe Mamani",
      address: null,
      phone: "987000111",
      email: "rosa@correo.pe",
    };
    const minor = { ...sheet, consumer: { ...sheet.consumer, guardian } };
    expect(complaintSheetSchema.safeParse(minor).success).toBe(true);
    const nameless = {
      ...sheet,
      consumer: { ...sheet.consumer, guardian: { ...guardian, fullName: "" } },
    };
    expect(complaintSheetSchema.safeParse(nameless).success).toBe(false);
  });

  it("leaves phone, amount, description, order and pedido optional", () => {
    const sheet = aComplaintSheet();
    const minimal = {
      ...sheet,
      consumer: { ...sheet.consumer, phone: null },
      goods: {
        type: "servicio",
        orderNumber: null,
        amount: null,
        description: null,
      },
      claim: {
        kind: "queja",
        detail: "Nadie respondió mi consulta.",
        request: null,
      },
    };
    expect(complaintSheetSchema.safeParse(minimal).success).toBe(true);
    const noDetail = { ...sheet, claim: { ...sheet.claim, detail: " " } };
    expect(complaintSheetSchema.safeParse(noDetail).success).toBe(false);
  });

  it("answers by email or by letter, as the consumer asks", () => {
    const letter = { ...aComplaintSheet(), responseChannel: "carta" };
    expect(complaintSheetSchema.safeParse(letter).success).toBe(true);
    const phone = { ...aComplaintSheet(), responseChannel: "telefono" };
    expect(complaintSheetSchema.safeParse(phone).success).toBe(false);
  });

  it("refuses a provider RUC with a wrong check digit", () => {
    const sheet = aComplaintSheet();
    const bad = {
      ...sheet,
      provider: { ...sheet.provider, ruc: "20131312956" },
    };
    expect(complaintSheetSchema.safeParse(bad).success).toBe(false);
    const valid = {
      ...sheet,
      provider: { ...sheet.provider, ruc: "20131312955" },
    };
    expect(complaintSheetSchema.safeParse(valid).success).toBe(true);
  });
});

describe("newComplaintSchema", () => {
  it("is the sheet before its number is assigned", () => {
    expect(newComplaintSchema.parse(aNewComplaint())).toEqual(aNewComplaint());
    expect(
      newComplaintSchema.safeParse({ ...aNewComplaint(), number: "x" }).success,
    ).toBe(false);
  });

  it("dates the filing as an ISO instant", () => {
    expect(aNewComplaint().filedAt).toBe(FILED_AT.toISOString());
    expect(
      newComplaintSchema.safeParse({ ...aNewComplaint(), filedAt: "ayer" })
        .success,
    ).toBe(false);
  });
});
