import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_COMPARED, SAMPLE_ROWS } from "./__fixtures__/comparison";
import { ComparisonTable } from "./comparison-table";

const meta = {
  title: "Organisms/ComparisonTable",
  component: ComparisonTable,
  tags: ["autodocs"],
  args: {
    caption: "Comparación de 3 cargadores",
    products: SAMPLE_COMPARED,
    rows: SAMPLE_ROWS,
  },
  argTypes: {
    products: { control: false },
    rows: { control: false },
  },
  parameters: {
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "The comparator: products side by side (image, brand, name link, price, availability, a «Quitar» link) and one row per spec, labels in a sticky first column. On phones the table scrolls sideways inside its own focusable region, never the page. Rows that differ carry a lit LED; missing values read «Sin dato».",
      },
    },
  },
} satisfies Meta<typeof ComparisonTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeProducts: Story = {};

export const TwoProducts: Story = {
  args: {
    caption: "Comparación de 2 cargadores",
    products: SAMPLE_COMPARED.slice(0, 2),
    rows: SAMPLE_ROWS.map((row) => ({
      ...row,
      values: row.values.slice(0, 2),
    })),
  },
};

export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2", isRotated: false } },
};
