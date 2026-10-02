import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "./heading";

const SIZES = ["display-xl", "display-l", "title"] as const;
const LEVELS = [1, 2, 3, 4, 5, 6] as const;

const meta = {
  title: "Atoms/Heading",
  component: Heading,
  tags: ["autodocs"],
  args: {
    level: 2,
    size: "title",
    children: "Cargadores que no se calientan",
  },
  argTypes: {
    level: { control: "inline-radio", options: LEVELS },
    size: { control: "inline-radio", options: SIZES },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Geist Sans 500 with the tight leading and tracking of each display token. `level` sets the document outline (h1…h6) and `size` sets the look, so a section can keep a correct outline with any visual size. Defaults to `size="title"`.',
      },
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Title: Story = {};

export const DisplayL: Story = {
  name: "Display L",
  args: { size: "display-l", children: "Accesorios para tu setup" },
};

export const DisplayXL: Story = {
  name: "Display XL",
  args: { level: 1, size: "display-xl", children: "Energía sin pausa" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col gap-1">
          <p className="font-mono text-caption text-muted-foreground">{size}</p>
          <Heading level={2} size={size}>
            Carga rápida, sin calor
          </Heading>
        </div>
      ))}
    </div>
  ),
};

export const LevelVersusSize: Story = {
  name: "Level vs size",
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="display-l">
        h2 con tamaño display-l
      </Heading>
      <Heading level={3} size="title">
        h3 con tamaño title
      </Heading>
      <Heading level={4} size="title">
        h4 con el mismo tamaño title
      </Heading>
    </div>
  ),
};
