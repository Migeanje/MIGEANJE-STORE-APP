// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getComplaintNotifier,
  getComplaintOutbox,
  getComplaintRepository,
  isDemoComplaintBook,
} from "./index";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("complaints composition root", () => {
  it("keeps one in-memory book and outbox for mock data", () => {
    vi.stubEnv("DATA_SOURCE", "mock");

    expect(getComplaintRepository()).toBe(getComplaintRepository());
    expect(getComplaintNotifier()).toBe(getComplaintNotifier());
    expect(getComplaintOutbox()).toBe(getComplaintNotifier());
    expect(isDemoComplaintBook()).toBe(true);
  });

  it("refuses Medusa until its adapters exist", () => {
    vi.stubEnv("DATA_SOURCE", "medusa");

    expect(() => getComplaintRepository()).toThrow(/F3/);
    expect(() => getComplaintNotifier()).toThrow(/F3/);
    expect(getComplaintOutbox()).toBeNull();
    expect(isDemoComplaintBook()).toBe(false);
  });
});
