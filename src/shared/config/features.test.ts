// @vitest-environment node
import { describe, expect, it } from "vitest";
import { features } from "./features";

describe("features", () => {
  it("keeps facturas off under Nuevo RUS (boletas only)", () => {
    expect(features.factura).toBe(false);
  });
});
