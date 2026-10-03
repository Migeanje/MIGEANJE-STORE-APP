import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

const MAX_LEDS = 10;

export type LedScoreProps = Omit<ComponentProps<"span">, "children"> & {
  /** Lit LEDs: an integer from 0 to `max`. */
  score: number;
  /** Total LEDs, an integer from 1 to 10. Defaults to 5. */
  max?: number;
};

/**
 * A score as a row of LED dots, like a charger's level lights: lit dots are
 * amber with a glow, unlit ones are `led-off` rings (shape, not only color).
 * The visible "4/5" is the text; assistive tech hears the dots as one image
 * named "4 de 5". Throws a RangeError for a score or max out of range.
 */
export function LedScore({
  score,
  max = 5,
  className,
  ...props
}: LedScoreProps) {
  if (!Number.isInteger(max) || max < 1 || max > MAX_LEDS) {
    throw new RangeError(
      `LedScore max must be an integer from 1 to ${MAX_LEDS}, got ${max}`,
    );
  }
  if (!Number.isInteger(score) || score < 0 || score > max) {
    throw new RangeError(
      `LedScore score must be an integer from 0 to ${max}, got ${score}`,
    );
  }
  const positions = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <span
      {...props}
      data-slot="led-score"
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        role="img"
        aria-label={`${score} de ${max}`}
        className="inline-flex items-center gap-1"
      >
        {positions.map((position) => (
          <span
            key={position}
            data-lit={position <= score}
            className={cn(
              "size-2.5 shrink-0 rounded-full",
              position <= score
                ? "bg-primary shadow-glow"
                : "border-2 border-led-off",
            )}
          />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="font-mono text-body-sm text-foreground tabular-nums"
      >
        {score}/{max}
      </span>
    </span>
  );
}
