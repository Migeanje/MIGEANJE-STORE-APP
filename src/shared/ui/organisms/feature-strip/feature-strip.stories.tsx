import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureStrip } from "./feature-strip";

const meta = {
  title: "Organisms/FeatureStrip",
  component: FeatureStrip,
  tags: ["autodocs"],
  args: {
    title: "Por qué Migeanje",
    items: [
      {
        title: "Curaduría",
        description:
          "Elegimos pocos productos y de marcas con buen respaldo. Si no lo usaríamos nosotros, no lo vendemos.",
      },
      {
        title: "Reseñas honestas",
        description:
          "Te contamos para quién es cada producto y para quién no, con una rúbrica clara y sin letra pequeña.",
      },
      {
        title: "Garantía local",
        description:
          "Pagas en soles y, si algo falla, lo resolvemos aquí en Perú, sin trámites con el extranjero.",
      },
    ],
  },
  argTypes: {
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
    items: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A titled strip of short value statements (the home\'s "Por qué Migeanje", draft copy). One column on phones, three from `md`; each item sits under a hairline with a short amber tick.',
      },
    },
  },
} satisfies Meta<typeof FeatureStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
