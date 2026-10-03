import * as z from "zod";
import { duplicates, textSchema } from "./primitives";

/** One rubric line: a criterion scored from 1 to 5 with a short note. */
export const rubricItemSchema = z.strictObject({
  criterion: textSchema,
  score: z.int().min(1).max(5),
  note: textSchema,
});

/**
 * Our editorial opinion on a product ("Cómo elegimos"). Generic on purpose:
 * the criteria and the copy live in the fixtures (later in the CMS).
 */
export const expertReviewSchema = z
  .strictObject({
    /** One or two sentences. */
    verdict: textSchema.max(240),
    forWhom: z.array(textSchema).min(1),
    notFor: z.array(textSchema).min(1),
    rubric: z.array(rubricItemSchema).min(1),
  })
  .superRefine(({ rubric }, ctx) => {
    for (const criterion of duplicates(rubric.map((item) => item.criterion))) {
      ctx.addIssue({
        code: "custom",
        message: `Rubric criterion "${criterion}" is used twice`,
        path: ["rubric"],
      });
    }
  });

export type RubricItem = z.infer<typeof rubricItemSchema>;
export type ExpertReview = z.infer<typeof expertReviewSchema>;
