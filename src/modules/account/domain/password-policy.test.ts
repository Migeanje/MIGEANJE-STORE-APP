// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  failedPasswordRules,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./password-policy";

describe("failedPasswordRules", () => {
  it("accepts 8 to 128 characters with a letter and a number", () => {
    expect(failedPasswordRules("Demo-2026!")).toEqual([]);
    expect(failedPasswordRules("abcdefg1")).toEqual([]);
    expect(failedPasswordRules(`a1${"x".repeat(126)}`)).toEqual([]);
  });

  it("says which rules a password breaks", () => {
    expect(failedPasswordRules("")).toEqual(["length", "letter", "digit"]);
    expect(failedPasswordRules("abc1")).toEqual(["length"]);
    expect(failedPasswordRules("12345678")).toEqual(["letter"]);
    expect(failedPasswordRules("contraseña")).toEqual(["digit"]);
    expect(failedPasswordRules(`a1${"x".repeat(127)}`)).toEqual(["length"]);
  });

  it("counts characters, not UTF-16 units, and takes any letter", () => {
    // 8 characters, 9 UTF-16 units with the emoji.
    expect(failedPasswordRules("ñandú1😀a")).toEqual([]);
    expect(failedPasswordRules("ñ1😀")).toEqual(["length"]);
  });

  it("documents its limits", () => {
    expect([PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH]).toEqual([8, 128]);
  });
});
