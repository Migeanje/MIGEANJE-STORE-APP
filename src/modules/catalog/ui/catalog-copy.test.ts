// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
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
