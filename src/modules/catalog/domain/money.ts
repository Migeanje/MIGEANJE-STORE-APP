import * as z from "zod";

/**
 * An amount in céntimos (S/ 129.90 is 12990): a non-negative safe integer,
 * the same rule `formatPEN` enforces (`z.int()` is limited to safe integers).
 */
export const moneySchema = z.int().nonnegative();

export type Money = z.infer<typeof moneySchema>;
