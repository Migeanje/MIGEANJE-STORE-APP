/**
 * WCAG 2.x relative luminance and contrast ratio for sRGB hex colors.
 * Spec: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parses `#rgb` or `#rrggbb` into 0-255 channels. */
export function parseHex(hex: string): Rgb {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Invalid hex color: ${JSON.stringify(hex)}`);
  }
  const digits =
    hex.length === 4
      ? [...hex.slice(1)].map((digit) => digit + digit).join("")
      : hex.slice(1);
  return {
    r: Number.parseInt(digits.slice(0, 2), 16),
    g: Number.parseInt(digits.slice(2, 4), 16),
    b: Number.parseInt(digits.slice(4, 6), 16),
  };
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio from 1 (identical) to 21 (black on white), order-independent. */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const [lighter, darker] = a >= b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
