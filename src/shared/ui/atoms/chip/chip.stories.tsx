import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Chip } from "./chip";

const FILTERS = ["USB-C", "65 W o más", "GaN", "Carga inalámbrica", "En stock"];

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/Chip",
  component: Chip,
  tags: ["autodocs"],
  args: {
    children: "USB-C",
  },
  argTypes: {
    pressed: { control: "boolean" },
    defaultPressed: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Toggleable filter: a native `<button type="button">` with `aria-pressed`, so Enter and Space work. Pressed lights up in amber (encendido: `primary` border and text plus the glow) and shows a check, so color is never the only signal. 36px tall, `rounded-sm`. Controlled (`pressed` + `onPressedChange`) or uncontrolled (`defaultPressed`).',
      },
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unpressed: Story = {};

export const Pressed: Story = {
  args: { defaultPressed: true },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Agotado" },
};

function FilterRow() {
  const [selected, setSelected] = useState<string[]>(["USB-C"]);
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Filtrar productos</legend>
      {FILTERS.map((filter) => (
        <Chip
          key={filter}
          pressed={selected.includes(filter)}
          onPressedChange={(pressed) =>
            setSelected((current) =>
              pressed
                ? [...current, filter]
                : current.filter((item) => item !== filter),
            )
          }
        >
          {filter}
        </Chip>
      ))}
      <Chip disabled>Agotado</Chip>
    </fieldset>
  );
}

export const FilterGroup: Story = {
  name: "Filter row (controlled)",
  render: () => <FilterRow />,
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
            <Chip>USB-C</Chip>
            <Chip defaultPressed>65 W o más</Chip>
            <Chip disabled>Agotado</Chip>
          </div>
        </div>
      ))}
    </div>
  ),
};
