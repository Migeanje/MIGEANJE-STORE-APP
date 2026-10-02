import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type Spec, SpecList } from "./spec-list";

const CHARGER: Spec[] = [
  { label: "Potencia máxima", value: 65, unit: "W" },
  { label: "Puertos", value: "2 × USB-C, 1 × USB-A" },
  { label: "Tecnología", value: "GaN" },
  { label: "Peso", value: 112, unit: "g" },
];

const POWER_BANK: Spec[] = [
  { label: "Capacidad", value: "20 000", unit: "mAh" },
  { label: "Salida máxima", value: 30, unit: "W" },
  { label: "Protocolos", value: "PD 3.0, QC 3.0" },
  { label: "Recarga completa", value: "3.5", unit: "h" },
  { label: "Peso", value: 340, unit: "g" },
];

const meta = {
  title: "Molecules/SpecList",
  component: SpecList,
  tags: ["autodocs"],
  args: {
    specs: CHARGER,
    variant: "full",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["full", "compact"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Product specs as a description list (`dl`/`dt`/`dd`): labels in `muted-foreground`, values and units in Geist Mono (data), joined with a no-break space. `full` (default) shows one spec per row with `border` dividers, for the product page and the comparator. `compact` is a two-column grid of label-over-value cells, for cards and quick views.",
      },
    },
  },
} satisfies Meta<typeof SpecList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const Compact: Story = {
  args: { variant: "compact" },
};

export const InContext: Story = {
  name: "In context (card and product page)",
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
        <p className="font-mono text-caption text-muted-foreground">
          compact · quick view
        </p>
        <SpecList specs={CHARGER} variant="compact" />
      </div>
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-5">
        <p className="font-mono text-caption text-muted-foreground">
          full · product page
        </p>
        <SpecList specs={POWER_BANK} />
      </div>
    </div>
  ),
};
