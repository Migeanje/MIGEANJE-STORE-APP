// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DATA_SOURCES, readDataSource } from "./data-source";

describe("readDataSource", () => {
  it("lists the supported data sources", () => {
    expect(DATA_SOURCES).toEqual(["mock", "medusa"]);
  });

  it.each([undefined, "", "  "])("defaults to mock for %j", (value) => {
    expect(readDataSource(value)).toBe("mock");
  });

  it.each(["mock", "medusa", " medusa "])("reads %j", (value) => {
    expect(readDataSource(value)).toBe(value.trim());
  });

  it("throws for an unknown value", () => {
    expect(() => readDataSource("postgres")).toThrow(
      'Unknown DATA_SOURCE "postgres". Expected one of: mock, medusa.',
    );
  });
});
