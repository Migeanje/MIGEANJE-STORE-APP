// Storybook-only stand-in for `geist/font/sans` and `geist/font/mono` (aliased
// in main.ts). The Storybook Next.js plugin applies its `next/font` transform
// only to files outside node_modules, so the `geist` package's own loaders do
// not bundle. Same font files and CSS variables as production, loaded from here.
import localFont from "next/font/local";

export const GeistSans = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const GeistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});
