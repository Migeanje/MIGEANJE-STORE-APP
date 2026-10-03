// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { aComplaintSheet } from "@/modules/complaints/testing/complaint-builders";
import { createMockComplaintNotifier } from "./mock-complaint-notifier";

const QUEUED_AT = new Date("2026-10-03T15:00:01Z");

describe("createMockComplaintNotifier", () => {
  it("queues a copy of the sheet for the consumer's email", async () => {
    const notifier = createMockComplaintNotifier({
      log: () => {},
      now: () => QUEUED_AT,
    });
    const sheet = aComplaintSheet();

    await notifier.sendCopy(sheet);

    expect(await notifier.outbox()).toEqual([
      {
        to: "ana@correo.pe",
        subject: "Copia de tu Hoja de Reclamación 000000001-2026",
        complaintNumber: "000000001-2026",
        queuedAt: QUEUED_AT.toISOString(),
        sheet,
      },
    ]);
  });

  it("logs one structured event without personal data", async () => {
    const log = vi.fn();
    const notifier = createMockComplaintNotifier({ log, now: () => QUEUED_AT });

    await notifier.sendCopy(aComplaintSheet());

    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toEqual({
      event: "complaint_copy_sent",
      adapter: "mock",
      complaintNumber: "000000001-2026",
      kind: "reclamo",
      recipientDomain: "correo.pe",
    });
    for (const personal of ["ana@", "46027897", "987654321", "Larco", "Ana"]) {
      expect(line).not.toContain(personal);
    }
  });

  it("keeps its outbox apart from the sheets it was given", async () => {
    const notifier = createMockComplaintNotifier({ log: () => {} });
    const sheet = aComplaintSheet();

    await notifier.sendCopy(sheet);
    sheet.claim.detail = "cambiado";
    const [message] = await notifier.outbox();
    if (!message) throw new Error("expected a message");
    message.to = "otro@correo.pe";

    const [again] = await notifier.outbox();
    expect(again?.sheet.claim.detail).toBe(aComplaintSheet().claim.detail);
    expect(again?.to).toBe("ana@correo.pe");
  });
});
