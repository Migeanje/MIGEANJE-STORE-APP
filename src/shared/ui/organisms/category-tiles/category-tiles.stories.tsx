import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CategoryTiles } from "./category-tiles";

// The nine categories of the mock catalog, in display order.
const CATEGORIES = [
  ["cargadores", "Cargadores", 3],
  ["power-banks", "Power banks", 3],
  ["cables", "Cables", 2],
  ["hubs-y-docks", "Hubs y docks", 2],
  ["carga-inalambrica", "Carga inalámbrica", 2],
  ["audio", "Audio", 3],
  ["almacenamiento", "Almacenamiento", 2],
  ["laptops", "Laptops", 1],
  ["tablets", "Tablets", 1],
] as const;

const meta = {
  title: "Organisms/CategoryTiles",
  component: CategoryTiles,
  tags: ["autodocs"],
  args: {
    categories: CATEGORIES.map(([slug, name, count]) => ({
      href: `/categorias/${slug}`,
      name,
      meta: `${count} ${count === 1 ? "producto" : "productos"}`,
    })),
  },
  argTypes: { categories: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'Typographic category tiles, no images: name plus a mono data line ("3 productos"). "Encendido": a warm glow and an amber arrow light up on hover and keyboard focus. 2 columns on phones, 3 from `sm`.',
      },
    },
  },
} satisfies Meta<typeof CategoryTiles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
