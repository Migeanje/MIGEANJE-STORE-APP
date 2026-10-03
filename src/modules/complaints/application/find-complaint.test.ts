// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createInMemoryComplaintRepository } from "@/modules/complaints/infrastructure/in-memory-complaint-repository";
import {
  aNewComplaint,
  COMPLAINT_ACCESS_TOKEN,
} from "@/modules/complaints/testing/complaint-builders";
import { findComplaintWithAccessToken } from "./find-complaint";

async function filed() {
  const complaints = createInMemoryComplaintRepository();
  const sheet = await complaints.file(aNewComplaint());
  return { complaints, sheet };
}

describe("findComplaintWithAccessToken", () => {
  it("returns the sheet whose secret token matches", async () => {
    const { complaints, sheet } = await filed();

    expect(
      await findComplaintWithAccessToken(
        complaints,
        sheet.number,
        COMPLAINT_ACCESS_TOKEN,
      ),
    ).toEqual(sheet);
  });

  it("returns null for a wrong token, an empty token or a malformed number", async () => {
    const { complaints, sheet } = await filed();

    expect(
      await findComplaintWithAccessToken(
        complaints,
        sheet.number,
        "00000000-0000-4000-8000-000000000000",
      ),
    ).toBeNull();
    expect(
      await findComplaintWithAccessToken(complaints, sheet.number, ""),
    ).toBeNull();
    expect(
      await findComplaintWithAccessToken(
        complaints,
        "lr-2026-1",
        COMPLAINT_ACCESS_TOKEN,
      ),
    ).toBeNull();
  });
});
