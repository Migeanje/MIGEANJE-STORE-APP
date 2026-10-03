import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_PRODUCTS } from "@/shared/ui/organisms/product-grid/__fixtures__/products";
import { ProductSection } from "./product-section";

const meta = {
  title: "Organisms/ProductSection",
  component: ProductSection,
  tags: ["autodocs"],
  args: {
    title: "Cargadores",
    products: SAMPLE_PRODUCTS.slice(0, 3),
    action: {
      href: "/categorias/cargadores?marca=anker",
      label: "Ver cargadores de Anker",
    },
  },
  argTypes: {
    products: { control: false },
    headingLevel: { control: "inline-radio", options: [2, 3] },
    columns: { control: "inline-radio", options: [3, 4] },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A titled group of product cards, e.g. one category on a brand page, with an optional "see more" link (the category filtered by the brand). The section is a region named by its heading; product names sit one level below.',
      },
    },
  },
} satisfies Meta<typeof ProductSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAction: Story = {};

export const WithoutAction: Story = {
  args: { action: undefined },
};
