// @vitest-environment node
import { describe, expect, it } from "vitest";
import { passwordHashSchema } from "./credentials";

const VALID = {
  algorithm: "scrypt",
  cost: 131072,
  blockSize: 8,
  parallelization: 1,
  salt: "q83vEjRWeJA=",
  hash: "AAECAwQFBgcICQoLDA0ODw==",
};

describe("passwordHashSchema", () => {
  it("accepts a scrypt hash with its parameters", () => {
    expect(passwordHashSchema.parse(VALID)).toEqual(VALID);
  });

  it.each([
    ["another algorithm", { algorithm: "md5" }],
    ["a cost that is not a power of two", { cost: 1000 }],
    ["a cost above 2^20 (memory exhaustion)", { cost: 2 ** 21 }],
    ["a salt that is not base64", { salt: "not base64!" }],
    ["an empty hash", { hash: "" }],
  ])("refuses %s", (_name, change) => {
    expect(passwordHashSchema.safeParse({ ...VALID, ...change }).success).toBe(
      false,
    );
  });
});
