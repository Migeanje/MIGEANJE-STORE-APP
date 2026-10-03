import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeHero } from "./home-hero";

const meta = {
  title: "Organisms/HomeHero",
  component: HomeHero,
  tags: ["autodocs"],
  args: {
    headline: "Tecnología elegida con criterio",
    lead: "Cargadores, cables, power banks y más: solo lo que le recomendaríamos a un amigo, con precios en soles y garantía en Perú.",
    cta: { href: "/categorias/cargadores", label: "Ver cargadores" },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Home hero without imagery: display-xl headline (the page h1), one line and a primary call to action over a warm amber glow. No loader: the text is visible from the first frame while the glow "warms up" over `--duration-story` (CSS `@starting-style`, instant with reduced motion). `overflow-hidden` keeps the glow from causing horizontal scroll on phones.',
      },
    },
  },
} satisfies Meta<typeof HomeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
