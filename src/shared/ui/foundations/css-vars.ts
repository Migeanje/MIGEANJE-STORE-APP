/**
 * Reads design tokens back from the live stylesheet, so the foundations docs
 * always show what tokens.css actually ships (never a hardcoded copy).
 */

type PropertySource = Pick<CSSStyleDeclaration, "getPropertyValue">;

/** Value of a CSS custom property (e.g. `--card`), trimmed; "" when undefined. */
export function readCssVar(source: PropertySource, name: string): string {
  return source.getPropertyValue(name).trim();
}

const PIXELS = /^(\d+(?:\.\d+)?)px$/;

/**
 * Reads a resolved length such as `getComputedStyle(el).paddingTop` ("8px")
 * as a number of pixels. Returns null for anything else (percentages, other
 * units, lists), so callers never do math on a value they cannot trust.
 */
export function toPixels(value: string): number | null {
  const pixels = PIXELS.exec(value.trim());
  return pixels ? Number(pixels[1]) : null;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// One separator style per color: every channel split by a comma, or every
// channel split by whitespace. Never both, never none.
const RGB_COMMAS = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGB_SPACES = /^rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\)$/i;

/**
 * Normalizes an opaque sRGB color (`#rgb`, `#rrggbb`, `rgb(r g b)` or
 * `rgb(r, g, b)` with integer channels 0-255) to lowercase `#rrggbb`, the
 * input `contrast.ts` expects. Returns null for anything else (keywords,
 * `color-mix()`, alpha, malformed or out-of-range channels), because a
 * contrast ratio is only meaningful for well-formed opaque colors.
 */
export function toHexColor(value: string): string | null {
  const color = value.trim();
  if (HEX.test(color)) {
    const digits = color.slice(1).toLowerCase();
    return digits.length === 3
      ? `#${[...digits].map((digit) => digit + digit).join("")}`
      : `#${digits}`;
  }
  const rgb = RGB_COMMAS.exec(color) ?? RGB_SPACES.exec(color);
  if (!rgb) {
    return null;
  }
  const channels = rgb.slice(1).map(Number);
  if (channels.some((channel) => channel > 255)) {
    return null;
  }
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
