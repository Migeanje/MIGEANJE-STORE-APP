/**
 * The token pairs components may combine and the WCAG 2.2 AA minimum each one
 * must meet. tokens.test.ts enforces them in CI and the Foundations/Colors docs
 * display them, so both read this single list. Framework-free on purpose:
 * plain data and pure functions, no CSS, DOM or React.
 */

export const TEXT_MIN = 4.5; // SC 1.4.3 normal text
export const NON_TEXT_MIN = 3; // SC 1.4.11 UI components and graphical objects

/** A foreground token on a background token, both as `--name`. */
export type ContrastPair = { fg: string; bg: string; min: number };

// Every surface a piece of text or a control may sit on.
const SURFACES = [
  "--background",
  "--card",
  "--popover",
  "--secondary",
  "--muted",
  "--accent",
  "--surface-raised",
] as const;

// Text tokens that may appear on any surface. `--primary` is included because
// the brand amber is also used for text (links, selected labels).
const TEXT_ON_ANY_SURFACE = [
  "--foreground",
  "--card-foreground",
  "--popover-foreground",
  "--secondary-foreground",
  "--muted-foreground",
  "--accent-foreground",
  "--primary",
  "--destructive",
] as const;

/** Text tokens on every surface. */
export const TEXT_PAIRS: readonly ContrastPair[] = TEXT_ON_ANY_SURFACE.flatMap(
  (fg) => SURFACES.map((bg) => ({ fg, bg, min: TEXT_MIN })),
);

/** Foreground tokens on their filled backgrounds. */
export const FILLED_PAIRS: readonly ContrastPair[] = [
  { fg: "--primary-foreground", bg: "--primary", min: TEXT_MIN },
  { fg: "--destructive-foreground", bg: "--destructive", min: TEXT_MIN },
];

/** Non-text tokens (rings, LEDs, form field borders) on surfaces. */
export const NON_TEXT_PAIRS: readonly ContrastPair[] = [
  // Focus ring and lit LED.
  ...SURFACES.map((bg) => ({ fg: "--ring", bg, min: NON_TEXT_MIN })),
  // Unavailable LED ring. Not for text on --surface-raised.
  ...SURFACES.map((bg) => ({ fg: "--led-off", bg, min: NON_TEXT_MIN })),
  // Form field borders identify the control. `--border` is decorative
  // (dividers, card outlines) and is exempt from SC 1.4.11.
  ...(["--background", "--card", "--popover"] as const).map((bg) => ({
    fg: "--input",
    bg,
    min: NON_TEXT_MIN,
  })),
];

/** Every allowed pair, in the order tokens.test.ts checks them. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  ...TEXT_PAIRS,
  ...FILLED_PAIRS,
  ...NON_TEXT_PAIRS,
];

/**
 * shadcn/ui names that only alias another token in tokens.css (`var(--x)`),
 * mapped to that source. tokens.test.ts verifies every entry, so collapsing an
 * alias pair never hides a different color. `--ring` aliases `--primary` but
 * is not listed: the docs show it as its own non-text role.
 */
export const ALIAS_SOURCES: ReadonlyMap<string, string> = new Map([
  ["--popover", "--card"],
  ["--secondary", "--surface-raised"],
  ["--muted", "--surface-raised"],
  ["--accent", "--surface-raised"],
  ["--card-foreground", "--foreground"],
  ["--popover-foreground", "--foreground"],
  ["--secondary-foreground", "--foreground"],
  ["--accent-foreground", "--foreground"],
]);

/**
 * Replaces alias tokens with their source and drops the duplicates that
 * leaves, keeping the first occurrence's order. The docs show these pairs.
 */
export function collapseAliases(
  pairs: readonly ContrastPair[],
): ContrastPair[] {
  const seen = new Set<string>();
  const collapsed: ContrastPair[] = [];
  for (const pair of pairs) {
    const fg = ALIAS_SOURCES.get(pair.fg) ?? pair.fg;
    const bg = ALIAS_SOURCES.get(pair.bg) ?? pair.bg;
    const key = `${fg} ${bg} ${pair.min}`;
    if (!seen.has(key)) {
      seen.add(key);
      collapsed.push({ fg, bg, min: pair.min });
    }
  }
  return collapsed;
}
