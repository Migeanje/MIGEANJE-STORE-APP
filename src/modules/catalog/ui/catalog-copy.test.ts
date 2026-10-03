// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  backorderNote,
  blockedOptionLabel,
  leadTimeLabel,
  productCountLabel,
  resultCountLabel,
  searchTitle,
} from "./catalog-copy";

describe("searchTitle", () => {
  it("echoes the query, or invites to search without one", () => {
    expect(searchTitle("cable usb")).toBe("Resultados para «cable usb»");
    expect(searchTitle("")).toBe("Buscar productos");
  });
});

describe("productCountLabel", () => {
  it.each([
    [0, "0 productos"],
    [1, "1 producto"],
    [4, "4 productos"],
    [1200, "1,200 productos"],
  ])("labels %i as %s", (count, label) => {
    expect(productCountLabel(count)).toBe(label);
  });
});

describe("resultCountLabel", () => {
  it.each([
    [4, 4, "4 productos"],
    [1, 4, "1 de 4 productos"],
    [0, 4, "0 de 4 productos"],
    [1, 1, "1 producto"],
  ])("labels %i of %i as %s", (shown, total, label) => {
    expect(resultCountLabel(shown, total)).toBe(label);
  });
});

describe("leadTimeLabel", () => {
  it.each([
    [{ min: 15, max: 20 }, "15–20 días"],
    [{ min: 3, max: 3 }, "3 días"],
    [{ min: 1, max: 1 }, "1 día"],
  ])("labels %j as %s", (leadTimeDays, label) => {
    expect(leadTimeLabel(leadTimeDays)).toBe(label);
  });
});

describe("backorderNote", () => {
  it("explains how a backorder works, with its lead time", () => {
    expect(backorderNote({ min: 15, max: 20 })).toBe(
      "En importación: lo pedimos para ti y llega en 15–20 días; pagas hoy y te avisamos en cada paso.",
    );
  });
});

describe("blockedOptionLabel", () => {
  it("names the earlier option a value does not combine with", () => {
    expect(
      blockedOptionLabel({
        kind: "combination",
        option: { key: "chip", label: "Chip" },
        value: "M5 (GPU de 8 núcleos)",
      }),
    ).toBe("No disponible con chip M5 (GPU de 8 núcleos)");
  });

  it("says a sold-out value is sold out", () => {
    expect(blockedOptionLabel({ kind: "sold_out" })).toBe("Agotado");
  });
});
