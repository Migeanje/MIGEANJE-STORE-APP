import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_PRODUCTS } from "./__fixtures__/products";
import { ProductGrid } from "./product-grid";

const meta = {
  title: "Organisms/ProductGrid",
  component: ProductGrid,
  tags: ["autodocs"],
  args: { products: SAMPLE_PRODUCTS, columns: 4 },
  argTypes: {
    columns: { control: "inline-radio", options: [3, 4] },
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    products: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Responsive list of ProductCards: 1 column on phones, 2 from `sm`, 4 from `lg` (or 3 next to a filters column). Renders nothing without products; pages show their own empty state.",
      },
    },
  },
} satisfies Meta<typeof ProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourColumns: Story = {
  name: "Full width (4 columns)",
};

export const ThreeColumns: Story = {
  name: "Next to filters (3 columns)",
  args: { columns: 3 },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
