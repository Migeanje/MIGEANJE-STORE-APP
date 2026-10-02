import type { Preview } from "@storybook/nextjs-vite";
import { themes } from "storybook/theming";
import { geistMono, geistSans } from "../src/shared/ui/tokens/fonts";
import "../src/app/globals.css";

// Mirror src/app/layout.tsx on the preview document: Spanish (Peru) content and
// the Geist font variables on <html>, so `font-sans` / `font-mono` resolve.
document.documentElement.lang = "es-PE";
document.documentElement.classList.add(geistSans.variable, geistMono.variable);

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="bg-background font-sans text-foreground antialiased">
        <Story />
      </div>
    ),
  ],
  parameters: {
    // Surface every axe violation as an error in the Accessibility panel.
    a11y: { test: "error" },
    docs: { theme: themes.dark },
  },
};

export default preview;
