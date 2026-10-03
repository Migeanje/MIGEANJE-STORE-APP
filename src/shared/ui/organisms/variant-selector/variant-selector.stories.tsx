import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { COLOR_GROUP, CONFIG_GROUPS } from "./__fixtures__/groups";
import { VariantSelector } from "./variant-selector";

const meta = {
  title: "Organisms/VariantSelector",
  component: VariantSelector,
  tags: ["autodocs"],
  args: { groups: [COLOR_GROUP] },
  argTypes: { groups: { control: false } },
  parameters: {
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component:
          "The variant options of a product page. Each value is a link to its variant (`?variante=<sku>`), so the selection is shareable and works without JavaScript; the selected value is `aria-current` with a check mark and the amber light. Values that cannot be chosen are not links: they are struck through, announced as «no disponible» and explained under the group. Swatches are optional and never replace the text.",
      },
    },
  },
} satisfies Meta<typeof VariantSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Color: Story = {};

export const Configuration: Story = {
  args: { groups: CONFIG_GROUPS },
};

export const WithSwatches: Story = {
  args: {
    groups: [
      {
        ...COLOR_GROUP,
        // Token colors only in our code; real swatches come from product data.
        values: COLOR_GROUP.values.map((entry, index) => ({
          ...entry,
          swatch: ["var(--foreground)", "var(--background)", "var(--led-off)"][
            index
          ],
        })),
      },
    ],
  },
};
