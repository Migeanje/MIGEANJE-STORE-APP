// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createMockUbigeoDirectory } from "@/modules/checkout/infrastructure/ubigeo.mock";
import { aUbigeoTree } from "@/modules/checkout/testing/checkout-builders";
import { createInMemoryComplaintRepository } from "@/modules/complaints/infrastructure/in-memory-complaint-repository";
import {
  A_PROVIDER,
  aFileComplaintInput,
  COMPLAINT_ACCESS_TOKEN,
  DUE_DATE,
  FILED_AT,
} from "@/modules/complaints/testing/complaint-builders";
import { type FileComplaintDeps, fileComplaint } from "./file-complaint";
import type { ComplaintNotifier } from "./ports";

const SENT_AT = new Date("2026-10-03T15:00:02Z");

function deps(overrides: Partial<FileComplaintDeps> = {}) {
  const sent: string[] = [];
  const notifier: ComplaintNotifier = {
    sendCopy: vi.fn(async (sheet) => {
      sent.push(sheet.number);
    }),
  };
  const clock = [FILED_AT, SENT_AT];
  const services: FileComplaintDeps = {
    complaints: createInMemoryComplaintRepository(),
    notifier,
    ubigeo: { tree: async () => aUbigeoTree() },
    provider: A_PROVIDER,
    now: () => clock.shift() ?? SENT_AT,
    newAccessToken: () => COMPLAINT_ACCESS_TOKEN,
    ...overrides,
  };
  return { services, sent, notifier };
}

describe("fileComplaint", () => {
  it("files the sheet under the next correlative with the due date", async () => {
    const { services } = deps();

    const result = await fileComplaint(services, aFileComplaintInput());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sheet.number).toBe("000000001-2026");
    expect(result.sheet.filedAt).toBe(FILED_AT.toISOString());
    expect(result.sheet.responseDueDate).toBe(DUE_DATE);
    expect(result.sheet.provider).toEqual(A_PROVIDER);
    expect(result.sheet.accessToken).toBe(COMPLAINT_ACCESS_TOKEN);
    expect(result.sheet.consumer.address.ubigeo.distrito).toEqual({
      code: "150122",
      name: "Miraflores",
    });
    expect(
      await services.complaints.findByNumber("000000001-2026"),
    ).toMatchObject({ number: "000000001-2026" });
  });

  it("sends the copy right away and records when", async () => {
    const { services, sent } = deps();

    const result = await fileComplaint(services, aFileComplaintInput());

    expect(sent).toEqual(["000000001-2026"]);
    expect(result).toMatchObject({ ok: true, copy: "sent" });
    if (!result.ok) return;
    expect(result.sheet.copySentAt).toBe(SENT_AT.toISOString());
    const stored = await services.complaints.findByNumber("000000001-2026");
    expect(stored?.copySentAt).toBe(SENT_AT.toISOString());
  });

  it("keeps the filed sheet when the copy cannot be sent", async () => {
    const { services } = deps({
      notifier: {
        sendCopy: async () => {
          throw new Error("SMTP down");
        },
      },
    });

    const result = await fileComplaint(services, aFileComplaintInput());

    expect(result).toMatchObject({
      ok: true,
      copy: "failed",
      copyFailure: "SMTP down",
    });
    const stored = await services.complaints.findByNumber("000000001-2026");
    expect(stored?.copySentAt).toBeNull();
  });

  it("numbers each filing of the year in turn", async () => {
    const complaints = createInMemoryComplaintRepository();
    const first = await fileComplaint(
      deps({ complaints }).services,
      aFileComplaintInput(),
    );
    const second = await fileComplaint(
      deps({ complaints, newAccessToken: () => crypto.randomUUID() }).services,
      aFileComplaintInput(),
    );

    expect(first.ok && first.sheet.number).toBe("000000001-2026");
    expect(second.ok && second.sheet.number).toBe("000000002-2026");
  });

  it("refuses a distrito that is not in the directory, filing nothing", async () => {
    const { services, notifier } = deps();
    const input = aFileComplaintInput();

    const result = await fileComplaint(services, {
      ...input,
      consumer: {
        ...input.consumer,
        address: {
          ...input.consumer.address,
          ubigeo: { departamento: "15", provincia: "1501", distrito: "040103" },
        },
      },
    });

    expect(result).toEqual({ ok: false, error: "unknown_ubigeo" });
    expect(notifier.sendCopy).not.toHaveBeenCalled();
    expect(await services.complaints.findByNumber("000000001-2026")).toBeNull();
  });

  it("works with the mock ubigeo directory", async () => {
    const { services } = deps({ ubigeo: createMockUbigeoDirectory() });

    const result = await fileComplaint(services, aFileComplaintInput());

    expect(result.ok).toBe(true);
  });

  it("fails loudly on input the form should have refused", async () => {
    const { services } = deps();
    const input = aFileComplaintInput();

    await expect(
      fileComplaint(services, {
        ...input,
        claim: { ...input.claim, detail: "" },
      }),
    ).rejects.toThrow();
    expect(await services.complaints.findByNumber("000000001-2026")).toBeNull();
  });
});
