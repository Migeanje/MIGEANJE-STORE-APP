import * as z from "zod";
import { slugSchema, textSchema } from "./primitives";

/** A brand we sell, named descriptively (never a logo). */
export const brandSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema,
});

export type Brand = z.infer<typeof brandSchema>;
