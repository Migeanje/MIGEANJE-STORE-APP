import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter } from "./site-footer";

const meta = {
  title: "Organisms/SiteFooter",
  component: SiteFooter,
  tags: ["autodocs"],
  args: {
    categories: [
      { slug: "cargadores", name: "Cargadores" },
      { slug: "power-banks", name: "Power banks" },
      { slug: "cables", name: "Cables" },
      { slug: "hubs-y-docks", name: "Hubs y docks" },
      { slug: "carga-inalambrica", name: "Carga inalámbrica" },
      { slug: "audio", name: "Audio" },
      { slug: "almacenamiento", name: "Almacenamiento" },
      { slug: "laptops", name: "Laptops" },
      { slug: "tablets", name: "Tablets" },
    ],
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Site footer: brand line, the always-visible "Libro de Reclamaciones" link (required by Peruvian consumer law, book icon), link columns "Tienda" (categories), "Ayuda" and "Nosotros" as labelled navigation landmarks, and the legal and payment lines. Text only: no third-party logos.',
      },
    },
  },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
