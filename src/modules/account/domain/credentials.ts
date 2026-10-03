import * as z from "zod";

/*
 * A stored password: never the password itself, only its scrypt hash with a
 * per-account random salt and the parameters it was computed with (so the
 * parameters can grow later without breaking existing accounts).
 */

// 2^20 already needs 1 GiB with a block size of 8: anything above it is a
// corrupt record, not a stronger hash.
const MAX_COST = 2 ** 20;

function isPowerOfTwo(value: number): boolean {
  return value > 1 && (value & (value - 1)) === 0;
}

export const passwordHashSchema = z.strictObject({
  algorithm: z.literal("scrypt"),
  /** scrypt's N (CPU/memory cost): a power of two. */
  cost: z.int().min(2).max(MAX_COST).refine(isPowerOfTwo, {
    message: "Expected a power of two",
  }),
  /** scrypt's r. */
  blockSize: z.int().min(1).max(32),
  /** scrypt's p. */
  parallelization: z.int().min(1).max(16),
  salt: z.base64().min(1),
  hash: z.base64().min(1),
});

export type PasswordHash = z.infer<typeof passwordHashSchema>;
