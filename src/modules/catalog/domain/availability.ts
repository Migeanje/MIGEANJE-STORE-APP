import * as z from "zod";

/** Business days until a backorder arrives, e.g. { min: 15, max: 20 }. */
export const leadTimeDaysSchema = z
  .strictObject({ min: z.int().min(1), max: z.int().min(1) })
  .refine((lead) => lead.min <= lead.max, {
    message: "leadTimeDays.min must not be above max",
    path: ["max"],
  });

export const availabilitySchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("in_stock") }),
  z.strictObject({
    status: z.literal("backorder"),
    leadTimeDays: leadTimeDaysSchema,
  }),
  z.strictObject({ status: z.literal("unavailable") }),
]);

export type Availability = z.infer<typeof availabilitySchema>;
export type AvailabilityStatus = Availability["status"];

const RANK: Record<AvailabilityStatus, number> = {
  in_stock: 0,
  backorder: 1,
  unavailable: 2,
};

/** In stock and backorder can be bought; unavailable cannot ("Avísame"). */
export function isPurchasable(availability: Availability): boolean {
  return availability.status !== "unavailable";
}

/**
 * Orders from best to worst: in stock, backorders by the latest then the
 * earliest arrival day, unavailable.
 */
export function compareAvailability(a: Availability, b: Availability): number {
  if (a.status === "backorder" && b.status === "backorder") {
    return (
      a.leadTimeDays.max - b.leadTimeDays.max ||
      a.leadTimeDays.min - b.leadTimeDays.min
    );
  }
  return RANK[a.status] - RANK[b.status];
}

/** The best entry (see `compareAvailability`). Throws a RangeError if empty. */
export function bestAvailability(
  availabilities: readonly Availability[],
): Availability {
  if (availabilities.length === 0) {
    throw new RangeError("bestAvailability needs at least one availability");
  }
  return availabilities.reduce((best, next) =>
    compareAvailability(next, best) < 0 ? next : best,
  );
}
