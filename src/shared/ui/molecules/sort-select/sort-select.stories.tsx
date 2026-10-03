import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SortSelect } from "./sort-select";

const meta = {
  title: "Molecules/SortSelect",
  component: SortSelect,
  tags: ["autodocs"],
  args: {
    action: "/categorias/cargadores",
    name: "orden",
    value: "relevancia",
    options: [
      { value: "relevancia", label: "Relevancia" },
      { value: "precio-asc", label: "Precio: menor a mayor" },
      { value: "precio-desc", label: "Precio: mayor a menor" },
    ],
    hiddenFields: [{ name: "marca", value: "anker" }],
    onApply: fn(),
  },
  argTypes: {
    value: {
      control: "inline-radio",
      options: ["relevancia", "precio-asc", "precio-desc"],
    },
    options: { control: false },
    hiddenFields: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Sort menu as a native GET form: a labelled `<select>` styled like our inputs plus hidden fields that keep the current filters. Changing it applies the sort at once (client navigation with `onApply`, a native submit otherwise). With scripting off, an "Ordenar" button submits it.',
      },
    },
  },
} satisfies Meta<typeof SortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PriceDescending: Story = {
  name: "Price, high to low",
  args: { value: "precio-desc" },
};
