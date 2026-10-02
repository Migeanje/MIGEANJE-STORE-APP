import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tag } from "./tag";

const SPECS = ["65 W", "USB-C", "GaN", "20 000 mAh", "PD 3.1"];

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/Tag",
  component: Tag,
  tags: ["autodocs"],
  args: {
    children: "Nuevo",
    mono: false,
  },
  argTypes: {
    mono: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Static, non-interactive label: `rounded-sm` on `surface-raised` in `caption`. `mono` switches to Geist Mono for spec values ("65 W", "USB-C", "GaN"). For a toggleable filter use `Chip`.',
      },
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Spec: Story = {
  name: "Spec value (mono)",
  args: { mono: true, children: "65 W" },
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
          <div className="flex flex-wrap gap-2">
            <Tag>Nuevo</Tag>
            <Tag>Carga rápida</Tag>
            {SPECS.map((spec) => (
              <Tag key={spec} mono>
                {spec}
              </Tag>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
