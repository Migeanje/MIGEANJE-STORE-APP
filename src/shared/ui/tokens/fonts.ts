// Geist ships its font files in the `geist` npm package and loads them with
// `next/font/local`, so builds never fetch fonts from the network. The CSS
// variables (`--font-geist-sans`, `--font-geist-mono`) feed `--font-sans` and
// `--font-mono` in tokens.css; apply both `.variable` classes on <html>.

/** Geist Mono: data only (specs, lead times, order numbers, SKUs). */
export { GeistMono as geistMono } from "geist/font/mono";
/** Geist Sans: UI and display (display weight 500). Variable font, 100-900. */
export { GeistSans as geistSans } from "geist/font/sans";
