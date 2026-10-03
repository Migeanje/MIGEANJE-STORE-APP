// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isSessionActive, SESSION_TTL_MS, sessionExpiry } from "./session";

describe("sessions", () => {
  const now = new Date("2026-10-03T15:00:00Z");

  it("last 7 days from sign-in", () => {
    expect(SESSION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(sessionExpiry(now).toISOString()).toBe("2026-10-10T15:00:00.000Z");
  });

  it("are active until they expire", () => {
    const session = {
      customerId: "c",
      createdAt: now.toISOString(),
      expiresAt: sessionExpiry(now).toISOString(),
    };
    expect(isSessionActive(session, now)).toBe(true);
    expect(isSessionActive(session, new Date("2026-10-10T14:59:59Z"))).toBe(
      true,
    );
    expect(isSessionActive(session, new Date("2026-10-10T15:00:00Z"))).toBe(
      false,
    );
  });
});
