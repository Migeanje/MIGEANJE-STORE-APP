import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "@/modules/account/application/ports";
import type { PasswordHash } from "@/modules/account/domain/credentials";

/** OWASP's minimum for scrypt: N=2^17, r=8, p=1 (about 128 MiB per hash). */
export const SCRYPT_DEFAULTS = {
  cost: 2 ** 17,
  blockSize: 8,
  parallelization: 1,
} as const;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

type ScryptParams = Pick<
  PasswordHash,
  "cost" | "blockSize" | "parallelization"
>;

function derive(
  password: string,
  salt: Buffer,
  { cost, blockSize, parallelization }: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      // The same password typed with composed or decomposed accents.
      password.normalize("NFKC"),
      salt,
      KEY_BYTES,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        // scrypt needs about 128 · N · r bytes; Node's default cap is 32 MiB.
        maxmem: 256 * cost * blockSize,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export type ScryptPasswordHasherOptions = Partial<ScryptParams>;

/**
 * PasswordHasher with Node's scrypt: a random 16-byte salt per password, a
 * 64-byte key and the parameters stored with the hash. Verification uses
 * the stored parameters and compares in constant time (`timingSafeEqual`).
 * Even for mock data: the demo must not teach a weaker pattern.
 */
export function createScryptPasswordHasher(
  options: ScryptPasswordHasherOptions = {},
): PasswordHasher {
  const params: ScryptParams = { ...SCRYPT_DEFAULTS, ...options };
  return {
    async hash(password) {
      const salt = randomBytes(SALT_BYTES);
      const key = await derive(password, salt, params);
      return {
        algorithm: "scrypt",
        ...params,
        salt: salt.toString("base64"),
        hash: key.toString("base64"),
      };
    },
    async verify(password, hash) {
      if (hash === null) {
        // Same work as a real check, then no.
        await derive(password, randomBytes(SALT_BYTES), params);
        return false;
      }
      const expected = Buffer.from(hash.hash, "base64");
      const key = await derive(
        password,
        Buffer.from(hash.salt, "base64"),
        hash,
      );
      return expected.length === key.length && timingSafeEqual(key, expected);
    },
  };
}
