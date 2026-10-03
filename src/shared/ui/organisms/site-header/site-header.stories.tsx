import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SiteHeader } from "./site-header";

// The nine categories of the mock catalog, in display order.
const CATEGORIES = [
  { slug: "cargadores", name: "Cargadores" },
  { slug: "power-banks", name: "Power banks" },
  { slug: "cables", name: "Cables" },
  { slug: "hubs-y-docks", name: "Hubs y docks" },
  { slug: "carga-inalambrica", name: "Carga inalámbrica" },
  { slug: "audio", name: "Audio" },
  { slug: "almacenamiento", name: "Almacenamiento" },
  { slug: "laptops", name: "Laptops" },
  { slug: "tablets", name: "Tablets" },
];

const meta = {
  title: "Organisms/SiteHeader",
  component: SiteHeader,
  tags: ["autodocs"],
  args: { categories: CATEGORIES, cartCount: 0 },
  argTypes: {
    cartCount: { control: { type: "number", min: 0, step: 1 } },
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: { pathname: "/categorias/cables" },
    },
    docs: {
      description: {
        component:
          'Sticky site header on a warm surface: the "Migeanje Store" wordmark (text, no logo), product search, account and cart links (the cart is named "Carrito, N productos"; an amber badge shows the count when it is above 0) and the category navigation, where the current page gets `aria-current="page"` and a lit amber bar. Below `lg`, navigation and search move into a menu sheet (focus trap, Escape returns focus to the menu button). The search is a native GET form to `/buscar`, enhanced with client navigation.',
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  name: "Desktop (current category: Cables)",
};

export const WithCartCount: Story = {
  name: "With items in the cart",
  args: { cartCount: 3 },
};

export const MobileMenuOpen: Story = {
  name: "Mobile, menu open",
  globals: { viewport: { value: "mobile2", isRotated: false } },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Abrir menú" }),
    );
    // The menu renders in a portal on document.body.
    await expect(
      within(document.body).getByRole("dialog", { name: "Menú" }),
    ).toBeVisible();
  },
};
