// @vitest-environment node
import { describe, expect, it } from "vitest";
import { passwordHashSchema } from "@/modules/account/domain/credentials";
import {
  createScryptPasswordHasher,
  SCRYPT_DEFAULTS,
} from "./scrypt-password-hasher";

// A small cost keeps the tests fast; production uses SCRYPT_DEFAULTS.
const hasher = createScryptPasswordHasher({ cost: 1024 });

describe("createScryptPasswordHasher", () => {
  it("uses OWASP's minimum scrypt parameters by default", () => {
    expect(SCRYPT_DEFAULTS).toEqual({
      cost: 2 ** 17,
      blockSize: 8,
      parallelization: 1,
    });
  });

  it("hashes with a random salt per password and stores its parameters", async () => {
    const first = await hasher.hash("Demo-2026!");
    const second = await hasher.hash("Demo-2026!");

    expect(passwordHashSchema.parse(first)).toEqual(first);
    expect(first).toMatchObject({
      algorithm: "scrypt",
      cost: 1024,
      blockSize: 8,
      parallelization: 1,
    });
    expect(Buffer.from(first.salt, "base64")).toHaveLength(16);
    expect(Buffer.from(first.hash, "base64")).toHaveLength(64);
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(JSON.stringify(first)).not.toContain("Demo-2026!");
  });

  it("verifies the right password only", async () => {
    const hash = await hasher.hash("Demo-2026!");

    expect(await hasher.verify("Demo-2026!", hash)).toBe(true);
    expect(await hasher.verify("demo-2026!", hash)).toBe(false);
    expect(await hasher.verify("", hash)).toBe(false);
  });

  it("verifies with the parameters stored in the hash", async () => {
    const stronger = createScryptPasswordHasher({ cost: 2048 });
    const hash = await stronger.hash("Clave-segura-1");

    expect(await hasher.verify("Clave-segura-1", hash)).toBe(true);
  });

  it("answers false without a hash (an unknown email), after the same work", async () => {
    expect(await hasher.verify("Demo-2026!", null)).toBe(false);
  });

  it("answers false for a stored hash of another length", async () => {
    const hash = await hasher.hash("Demo-2026!");
    expect(
      await hasher.verify("Demo-2026!", {
        ...hash,
        hash: Buffer.from("short").toString("base64"),
      }),
    ).toBe(false);
  });
});
