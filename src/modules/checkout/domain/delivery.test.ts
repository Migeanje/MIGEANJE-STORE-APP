// @vitest-environment node
import { describe, expect, it } from "vitest";
import { addBusinessDays, deliveryWindow, limaDate } from "./delivery";

describe("limaDate", () => {
  it("is the calendar date in Lima (UTC−5)", () => {
    expect(limaDate(new Date("2026-10-03T15:00:00Z"))).toBe("2026-10-03");
    // 02:00 UTC is still the evening before in Lima.
    expect(limaDate(new Date("2026-10-03T02:00:00Z"))).toBe("2026-10-02");
    expect(limaDate(new Date("2026-10-03T05:00:00Z"))).toBe("2026-10-03");
  });
});

describe("addBusinessDays", () => {
  it("skips Saturdays and Sundays", () => {
    // 2026-10-02 is a Friday.
    expect(addBusinessDays("2026-10-02", 1)).toBe("2026-10-05");
    expect(addBusinessDays("2026-10-02", 2)).toBe("2026-10-06");
    expect(addBusinessDays("2026-10-05", 5)).toBe("2026-10-12");
  });

  it("starts counting on the next business day from a weekend", () => {
    // 2026-10-03 is a Saturday.
    expect(addBusinessDays("2026-10-03", 1)).toBe("2026-10-05");
  });

  it("crosses months and years", () => {
    expect(addBusinessDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addBusinessDays("2026-10-30", 1)).toBe("2026-11-02");
  });

  it("returns the same date for zero days", () => {
    expect(addBusinessDays("2026-10-03", 0)).toBe("2026-10-03");
  });

  it("throws for negative or fractional days and malformed dates", () => {
    expect(() => addBusinessDays("2026-10-03", -1)).toThrow(RangeError);
    expect(() => addBusinessDays("2026-10-03", 1.5)).toThrow(RangeError);
    expect(() => addBusinessDays("03/10/2026", 1)).toThrow(RangeError);
  });
});

describe("deliveryWindow", () => {
  it("counts business days from the Lima date of the order", () => {
    // Friday 2026-10-02, 20:00 in Lima.
    expect(
      deliveryWindow(new Date("2026-10-03T01:00:00Z"), { min: 1, max: 2 }),
    ).toEqual({ from: "2026-10-05", to: "2026-10-06" });
  });
});
