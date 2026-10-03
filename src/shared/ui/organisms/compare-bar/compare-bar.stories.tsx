import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { CompareBar } from "./compare-bar";

const meta = {
  title: "Organisms/CompareBar",
  component: CompareBar,
  tags: ["autodocs"],
  args: {
    items: [
      { key: "prime-100w", name: "Prime Charger 100W, 3 puertos" },
      { key: "nexode-65w", name: "Nexode Cargador 65W" },
    ],
    categoryName: "Cargadores",
    max: 4,
    compareHref: "/comparar?productos=prime-100w,nexode-65w",
    onClear: fn(),
  },
  argTypes: { items: { control: false } },
  parameters: {
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "The compare tray, stuck to the bottom of the viewport on discovery pages: the count (and the product names from `lg`), «Vaciar» and the «Comparar (n)» link to the comparator, or a hint while only one product is picked. Renders nothing for an empty tray.",
      },
    },
  },
} satisfies Meta<typeof CompareBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyToCompare: Story = {};

export const OneProduct: Story = {
  args: {
    items: [{ key: "prime-100w", name: "Prime Charger 100W, 3 puertos" }],
    compareHref: null,
  },
};
