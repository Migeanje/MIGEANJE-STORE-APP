import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { mergeConfig } from "vite";

const geistFonts = fileURLToPath(new URL("./geist-fonts.ts", import.meta.url));

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  features: {
    // Dark-only UI: stories always render on our tokens, never on a picked background.
    backgrounds: false,
  },
  core: {
    disableTelemetry: true,
  },
  // See geist-fonts.ts: the `geist` package's next/font loaders do not bundle
  // in Storybook, so its two entry points resolve to a local stand-in.
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: {
        alias: [
          { find: /^geist\/font\/(sans|mono)$/, replacement: geistFonts },
        ],
      },
    }),
};

export default config;
