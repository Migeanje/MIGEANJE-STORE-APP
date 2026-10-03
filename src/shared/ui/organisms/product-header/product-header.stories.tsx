import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductHeader } from "./product-header";

const meta = {
  title: "Organisms/ProductHeader",
  component: ProductHeader,
  tags: ["autodocs"],
  args: {
    brand: { name: "Anker", href: "/marcas/anker" },
    name: "Prime Charger 100W, 3 puertos",
    model: "A2688",
    summary:
      "Tres puertos (2 USB-C y 1 USB-A) para cargar tu laptop, celular y audífonos con un solo enchufe.",
    category: { name: "Cargadores", href: "/categorias/cargadores" },
  },
  parameters: {
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "Top of the product page: the category eyebrow and the brand (plain text, never a logo) link to their pages; the product name is the h1; the model number is data, so it uses Geist Mono.",
      },
    },
  },
} satisfies Meta<typeof ProductHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutModel: Story = {
  args: {
    brand: { name: "Apple", href: "/marcas/apple" },
    name: "MacBook Air de 13 pulgadas (M5)",
    model: undefined,
    category: { name: "Laptops", href: "/categorias/laptops" },
  },
};
