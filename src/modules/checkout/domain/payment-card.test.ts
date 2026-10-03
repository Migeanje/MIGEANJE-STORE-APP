// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  cardLast4,
  isCardExpired,
  isLuhnValid,
  normalizeCardNumber,
  parseCardExpiry,
} from "./payment-card";

describe("normalizeCardNumber", () => {
  it("drops spaces and hyphens", () => {
    expect(normalizeCardNumber("4111 1111-1111 1111")).toBe("4111111111111111");
  });
});

describe("isLuhnValid", () => {
  it.each([
    "4111111111111111",
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
  ])("accepts %s", (number) => {
    expect(isLuhnValid(number)).toBe(true);
  });

  it.each(["4111111111111112", "1234567812345678"])("rejects %s", (number) => {
    expect(isLuhnValid(number)).toBe(false);
  });

  it("rejects non-digits and lengths outside 13–19", () => {
    expect(isLuhnValid("4111 1111 1111 1111")).toBe(false);
    expect(isLuhnValid("411111111111")).toBe(false);
    expect(isLuhnValid("41111111111111111111")).toBe(false);
    expect(isLuhnValid("")).toBe(false);
  });
});

describe("parseCardExpiry", () => {
  it("reads MM/AA and MM/AAAA", () => {
    expect(parseCardExpiry("08/28")).toEqual({ month: 8, year: 2028 });
    expect(parseCardExpiry(" 12 / 2030 ")).toEqual({ month: 12, year: 2030 });
    expect(parseCardExpiry("0828")).toEqual({ month: 8, year: 2028 });
  });

  it.each(["13/28", "00/28", "8/2", "ab/cd", "", "08/281"])(
    "rejects %s",
    (input) => {
      expect(parseCardExpiry(input)).toBeNull();
    },
  );
});

describe("isCardExpired", () => {
  const now = new Date("2026-10-03T15:00:00Z");

  it("is valid through the last day of its month", () => {
    expect(isCardExpired({ month: 10, year: 2026 }, now)).toBe(false);
    expect(isCardExpired({ month: 1, year: 2027 }, now)).toBe(false);
  });

  it("is expired from the month after", () => {
    expect(isCardExpired({ month: 9, year: 2026 }, now)).toBe(true);
    expect(isCardExpired({ month: 12, year: 2025 }, now)).toBe(true);
  });

  it("uses the month in Lima", () => {
    // 2026-11-01 03:00 UTC is still October 31st in Lima.
    expect(
      isCardExpired(
        { month: 10, year: 2026 },
        new Date("2026-11-01T03:00:00Z"),
      ),
    ).toBe(false);
  });
});

describe("cardLast4", () => {
  it("returns the last four digits", () => {
    expect(cardLast4("4111111111111111")).toBe("1111");
  });
});
