import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { HomePageTemplate } from "./home-page";

const CATEGORIES = [
  ["cargadores", "Cargadores", "3 productos"],
  ["power-banks", "Power banks", "3 productos"],
  ["cables", "Cables", "2 productos"],
  ["hubs-y-docks", "Hubs y docks", "2 productos"],
  ["carga-inalambrica", "Carga inalámbrica", "2 productos"],
  ["audio", "Audio", "3 productos"],
  ["almacenamiento", "Almacenamiento", "2 productos"],
  ["laptops", "Laptops", "1 producto"],
  ["tablets", "Tablets", "1 producto"],
] as const;

const meta = {
  title: "Templates/HomePage",
  component: HomePageTemplate,
  tags: ["autodocs"],
  args: {
    heroCta: { href: "/categorias/cargadores", label: "Ver cargadores" },
    featured: SAMPLE_PRODUCTS,
    categories: CATEGORIES.map(([slug, name, meta]) => ({
      href: `/categorias/${slug}`,
      name,
      meta,
    })),
  },
  argTypes: {
    featured: { control: false },
    categories: { control: false },
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'Home page: hero (h1, warm glow, call to action to a category), "Destacados" (in-stock products), category tiles with counts, "Por qué Migeanje" and the "En importación" explainer (15 to 20 business days). Sections below the hero reveal on scroll, never under reduced motion. Hero, "Por qué" and explainer copy are drafts pending owner review.',
      },
    },
  },
} satisfies Meta<typeof HomePageTemplate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const NothingInStock: Story = {
  name: "Nothing in stock (no Destacados)",
  args: { featured: [] },
};
