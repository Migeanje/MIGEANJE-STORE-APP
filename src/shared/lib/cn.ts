import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * tailwind-merge only knows Tailwind's default theme. Register every custom
 * token utility from src/shared/ui/tokens/tokens.css here, or it is merged
 * into the wrong group: `text-display-xl` would count as a text color and
 * silently drop `text-foreground`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // --text-*: our type scale (font sizes).
      text: ["display-xl", "display-l", "title", "body", "body-sm", "caption"],
      // --radius-*: Tailwind's t-shirt sizes are known already; `pill` is not.
      radius: ["pill"],
      // --shadow-*: the "encendido" glow.
      shadow: ["glow"],
    },
  },
});

/** Joins class values (clsx) and resolves Tailwind conflicts: the last wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
