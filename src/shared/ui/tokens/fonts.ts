import { Geist, Geist_Mono } from "next/font/google";

// Self-hosted at build time by next/font. The CSS variables feed `--font-sans`
// and `--font-mono` in tokens.css; apply both `.variable` classes on <html>.

/** Geist Sans: UI and display (display weight 500). */
export const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});

/** Geist Mono: data only (specs, lead times, order numbers, SKUs). */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});
