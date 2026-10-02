import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Price } from "./price";

const SIZES = ["sm", "md", "lg"] as const;

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/Price",
  component: Price,
  tags: ["autodocs"],
  args: {
    amount: 12990,
    size: "md",
  },
  argTypes: {
    amount: { control: { type: "number", min: 0, step: 1 } },
    compareAt: { control: { type: "number", min: 0, step: 1 } },
    size: { control: "inline-radio", options: SIZES },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Price in soles from integer céntimos (`amount={12990}` is S/ 129.90), formatted with `formatPEN` (`Intl`, es-PE). Geist Sans with tabular figures. `compareAt` shows the previous price struck through, only when it is greater than `amount`; both prices then get visually hidden labels ("Precio actual", "Precio anterior"). Invalid amounts (fractions, negatives, NaN) throw a RangeError.',
      },
    },
  },
} satisfies Meta<typeof Price>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCompareAt: Story = {
  name: "With previous price",
  args: { compareAt: 15990 },
};

export const Large: Story = {
  args: { size: "lg", amount: 18900, compareAt: 21900 },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col gap-1">
          <p className="font-mono text-caption text-muted-foreground">{size}</p>
          <Price size={size} amount={12990} compareAt={15990} />
          <Price size={size} amount={159990} />
        </div>
      ))}
    </div>
  ),
};

export const OnSurfaces: Story = {
  name: "On every surface",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {SURFACES.map((surface) => (
        <div
          key={surface.name}
          className={`flex flex-col gap-3 rounded-lg border p-5 ${surface.className}`}
        >
          <p className="font-mono text-caption text-muted-foreground">
            {surface.name}
          </p>
          <Price amount={4990} />
          <Price amount={12990} compareAt={15990} />
          <Price size="lg" amount={18900} compareAt={21900} />
        </div>
      ))}
    </div>
  ),
};
