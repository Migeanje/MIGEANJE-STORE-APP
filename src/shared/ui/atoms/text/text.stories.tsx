import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Text } from "./text";

const SIZES = ["body", "body-sm", "caption"] as const;
const TONES = ["default", "muted"] as const;

// Class names are written in full so Tailwind detects them.
const SURFACES = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "surface-raised", className: "bg-surface-raised" },
] as const;

const meta = {
  title: "Atoms/Text",
  component: Text,
  tags: ["autodocs"],
  args: {
    children:
      "Cargador GaN de 65 W con tres puertos: carga tu laptop, tu celular y tus audífonos a la vez.",
  },
  argTypes: {
    as: { control: "inline-radio", options: ["p", "span", "div"] },
    size: { control: "inline-radio", options: SIZES },
    tone: { control: "inline-radio", options: TONES },
    mono: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Body copy on the type scale: `body` 16px/1.5 (default), `body-sm` and `caption`. `tone="muted"` for secondary copy. `mono` switches to Geist Mono, only for data (specs, lead times, order numbers, SKUs). Renders a `p` by default; use `as` for `span` or `div`.',
      },
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};

export const Muted: Story = {
  args: { tone: "muted", size: "body-sm", children: "Precios incluyen IGV." },
};

export const MonoData: Story = {
  name: "Mono (data)",
  args: {
    mono: true,
    size: "body-sm",
    children: "Pedido N.º 000123 · SKU MGJ-GAN-65W",
  },
};

export const OnSurfaces: Story = {
  name: "Sizes and tones on every surface",
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {SURFACES.map((surface) => (
        <div
          key={surface.name}
          className={`flex flex-col gap-3 rounded-lg border p-5 ${surface.className}`}
        >
          <Text size="caption" tone="muted" mono>
            {surface.name}
          </Text>
          {SIZES.map((size) =>
            TONES.map((tone) => (
              <Text key={`${size}-${tone}`} size={size} tone={tone}>
                {size} · {tone}: envíos a todo el Perú
              </Text>
            )),
          )}
          <Text size="body-sm" mono>
            Llega en 15–20 días
          </Text>
        </div>
      ))}
    </div>
  ),
};
