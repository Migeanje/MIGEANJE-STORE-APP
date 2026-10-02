// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "./contrast";

// Guards the design tokens in tokens.css: WCAG 2.2 AA contrast for every
// pair components are allowed to combine, the "no green in UI" rule, and the
// shadcn naming contract. If a token changes, these tests must stay green.

const TEXT_MIN = 4.5; // SC 1.4.3 normal text
const NON_TEXT_MIN = 3; // SC 1.4.11 UI components and graphical objects

const source = readFileSync(join(import.meta.dirname, "tokens.css"), "utf8");
const css = source.replace(/\/\*[\s\S]*?\*\//g, "");

/** Returns the body of the first brace-balanced block whose prelude matches. */
function extractBlock(stylesheet: string, prelude: RegExp): string {
  const match = prelude.exec(stylesheet);
  if (!match) {
    throw new Error(`tokens.css has no block matching ${prelude}`);
  }
  const open = stylesheet.indexOf("{", match.index + match[0].length);
  let depth = 0;
  for (let index = open; index < stylesheet.length; index++) {
    if (stylesheet[index] === "{") depth++;
    if (stylesheet[index] === "}") depth--;
    if (depth === 0) {
      return stylesheet.slice(open + 1, index);
    }
  }
  throw new Error(`Unbalanced braces after ${prelude}`);
}

function parseCustomProperties(block: string): Map<string, string> {
  const properties = new Map<string, string>();
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    properties.set(name, value.trim());
  }
  return properties;
}

const rootBlock = extractBlock(css, /:root\s*(?=\{)/);
const tokens = parseCustomProperties(rootBlock);

/** Follows `var(--x)` aliases until a literal value is reached. */
function resolveToken(name: string, seen: string[] = []): string {
  if (seen.includes(name)) {
    throw new Error(`Circular token alias: ${[...seen, name].join(" -> ")}`);
  }
  const value = tokens.get(name);
  if (value === undefined) {
    throw new Error(`Token ${name} is not defined in :root`);
  }
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolveToken(alias[1], [...seen, name]) : value;
}

function resolveHex(name: string): string {
  const value = resolveToken(name);
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(
      `Token ${name} must resolve to a 6-digit hex, got ${value}`,
    );
  }
  return value;
}

// shadcn/ui variable contract, so restyled shadcn primitives drop in.
const SHADCN_TOKENS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
] as const;

const EXTRA_TOKENS = ["--surface-raised", "--led-off", "--glow"] as const;

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

type Pair = { fg: string; bg: string; min: number };

const pairs: Pair[] = [
  ...TEXT_ON_ANY_SURFACE.flatMap((fg) =>
    SURFACES.map((bg) => ({ fg, bg, min: TEXT_MIN })),
  ),
  { fg: "--primary-foreground", bg: "--primary", min: TEXT_MIN },
  { fg: "--destructive-foreground", bg: "--destructive", min: TEXT_MIN },
  // Focus ring and lit LED (non-text).
  ...SURFACES.map((bg) => ({ fg: "--ring", bg, min: NON_TEXT_MIN })),
  // Unavailable LED ring (non-text). Not for text on --surface-raised.
  ...SURFACES.map((bg) => ({ fg: "--led-off", bg, min: NON_TEXT_MIN })),
  // Form field borders identify the control (non-text). `--border` is
  // decorative (dividers, card outlines) and is exempt from SC 1.4.11.
  ...(["--background", "--card", "--popover"] as const).map((bg) => ({
    fg: "--input",
    bg,
    min: NON_TEXT_MIN,
  })),
];

function hueAndSaturation(hex: string): { hue: number; saturation: number } {
  const { r, g, b } = parseHex(hex);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) {
    return { hue: 0, saturation: 0 };
  }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === rn) {
    hue = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }
  return { hue: (hue * 60 + 360) % 360, saturation };
}

describe("design tokens", () => {
  it.each([...SHADCN_TOKENS, ...EXTRA_TOKENS])(
    "defines %s in :root",
    (name) => {
      expect(tokens.has(name)).toBe(true);
    },
  );

  it("uses the brand amber #FCBA03 as primary", () => {
    expect(resolveHex("--primary").toUpperCase()).toBe("#FCBA03");
  });

  it.each(pairs)("$fg on $bg meets $min:1", ({ fg, bg, min }) => {
    const ratio = contrastRatio(resolveHex(fg), resolveHex(bg));
    expect(
      ratio,
      `${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
    ).toBeGreaterThanOrEqual(min);
  });

  it("keeps every color literal in :root so a theme only redefines values", () => {
    const hexPattern = /#[0-9a-f]{3,8}\b/gi;
    const allHex = css.match(hexPattern) ?? [];
    const rootHex = rootBlock.match(hexPattern) ?? [];

    expect(rootHex.length).toBeGreaterThan(0);
    expect(allHex).toEqual(rootHex);
    expect(css).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/i);
  });

  it("contains no green-hued token (green lives only in photography)", () => {
    const hexValues = rootBlock.match(/#[0-9a-f]{6}\b/gi) ?? [];
    const greens = hexValues.filter((hex) => {
      const { hue, saturation } = hueAndSaturation(hex);
      return hue >= 80 && hue <= 170 && saturation > 0.2;
    });

    expect(greens).toEqual([]);
  });

  it("maps every shadcn token to a Tailwind color utility", () => {
    for (const name of [...SHADCN_TOKENS, "--surface-raised", "--led-off"]) {
      const utility = `--color-${name.slice(2)}`;
      expect(css).toContain(`${utility}: var(${name});`);
    }
  });

  it("resets Tailwind's default palette and radii", () => {
    expect(css).toMatch(/--color-\*:\s*initial;/);
    expect(css).toMatch(/--radius-\*:\s*initial;/);
  });

  it("makes motion instant and disables smooth scroll on reduced motion", () => {
    const reduced = extractBlock(
      css,
      /@media\s*\(prefers-reduced-motion:\s*reduce\)/,
    );

    expect(reduced).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(reduced).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(reduced).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});
