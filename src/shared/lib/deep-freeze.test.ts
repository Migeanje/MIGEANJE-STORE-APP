// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deepFreeze } from "./deep-freeze";

describe("deepFreeze", () => {
  it("freezes nested objects and arrays in place", () => {
    const value = { list: [{ name: "Lima" }], nested: { code: "15" } };
    const frozen = deepFreeze(value);

    expect(frozen).toBe(value);
    expect(Object.isFrozen(value.list)).toBe(true);
    expect(Object.isFrozen(value.list[0])).toBe(true);
    expect(() => {
      (value.nested as { code: string }).code = "07";
    }).toThrow(TypeError);
  });

  it("returns primitives and null unchanged", () => {
    expect(deepFreeze(3)).toBe(3);
    expect(deepFreeze(null)).toBeNull();
  });
});
