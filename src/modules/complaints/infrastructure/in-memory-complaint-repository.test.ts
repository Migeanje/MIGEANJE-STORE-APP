// @vitest-environment node
import { describe, expect, it } from "vitest";
import { responseDueDate } from "@/modules/complaints/domain/complaint";
import {
  aNewComplaint,
  FILED_AT,
} from "@/modules/complaints/testing/complaint-builders";
import { createInMemoryComplaintRepository } from "./in-memory-complaint-repository";

function filedOn(instant: Date) {
  return aNewComplaint({
    filedAt: instant.toISOString(),
    responseDueDate: responseDueDate(instant),
    accessToken: crypto.randomUUID(),
  });
}

describe("createInMemoryComplaintRepository", () => {
  it("numbers sheets with a correlative that restarts every year in Lima", async () => {
    const complaints = createInMemoryComplaintRepository();

    const first = await complaints.file(aNewComplaint());
    const second = await complaints.file(filedOn(FILED_AT));
    // 31 Dec 2026, 11 p.m. in Lima: still 2026.
    const lastOfYear = await complaints.file(
      filedOn(new Date("2027-01-01T04:00:00Z")),
    );
    const nextYear = await complaints.file(
      filedOn(new Date("2027-01-01T06:00:00Z")),
    );

    expect([first, second, lastOfYear, nextYear].map((s) => s.number)).toEqual([
      "000000001-2026",
      "000000002-2026",
      "000000003-2026",
      "000000001-2027",
    ]);
  });

  it("validates before numbering, so a bad sheet leaves no gap", async () => {
    const complaints = createInMemoryComplaintRepository();

    await expect(
      complaints.file({ ...aNewComplaint(), responseDueDate: "2026-12-31" }),
    ).rejects.toThrow();
    const sheet = await complaints.file(aNewComplaint());

    expect(sheet.number).toBe("000000001-2026");
  });

  it("returns copies: changing one never changes the book", async () => {
    const complaints = createInMemoryComplaintRepository();
    const sheet = await complaints.file(aNewComplaint());

    sheet.claim.detail = "cambiado";
    const read = await complaints.findByNumber(sheet.number);
    if (!read) throw new Error("expected the sheet");
    read.consumer.email = "otro@correo.pe";

    const again = await complaints.findByNumber(sheet.number);
    expect(again?.claim.detail).toBe(aNewComplaint().claim.detail);
    expect(again?.consumer.email).toBe("ana@correo.pe");
  });

  it("records when the copy was sent", async () => {
    const complaints = createInMemoryComplaintRepository();
    const { number } = await complaints.file(aNewComplaint());

    await complaints.markCopySent(number, "2026-10-03T15:00:02.000Z");

    expect((await complaints.findByNumber(number))?.copySentAt).toBe(
      "2026-10-03T15:00:02.000Z",
    );
    await expect(
      complaints.markCopySent("000999999-2026", "2026-10-03T15:00:02.000Z"),
    ).rejects.toThrow(/000999999-2026/);
  });

  it("answers null for an unknown number", async () => {
    const complaints = createInMemoryComplaintRepository();

    expect(await complaints.findByNumber("000000001-2026")).toBeNull();
  });
});
