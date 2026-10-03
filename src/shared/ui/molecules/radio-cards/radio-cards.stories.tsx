import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RadioCards } from "./radio-cards";

const meta = {
  title: "Molecules/RadioCards",
  component: RadioCards,
  tags: ["autodocs"],
  args: {
    legend: "Tipo",
    name: "kind",
    idPrefix: "story-kind",
    required: true,
    options: [
      {
        value: "reclamo",
        label: "Reclamo",
        description: "Disconformidad relacionada a los productos o servicios.",
      },
      {
        value: "queja",
        label: "Queja",
        description:
          "Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.",
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        component:
          "A choice between a few options shown as cards: native radios in a fieldset (they post without JavaScript and move with the arrow keys). The whole card selects its option; the label is the option's name and the description (e.g. a legal definition) its accessible description. The checked card gets the amber border. Radio ids are the idPrefix, a dash and the value.",
      },
    },
  },
} satisfies Meta<typeof RadioCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { defaultValue: "queja" },
};

export const TwoColumns: Story = {
  args: {
    legend: "¿Sobre qué es tu reclamo o queja?",
    name: "goodType",
    idPrefix: "story-good",
    columns: 2,
    defaultValue: "producto",
    options: [
      { value: "producto", label: "Producto" },
      { value: "servicio", label: "Servicio" },
    ],
  },
};

export const WithError: Story = {
  args: { error: "Elige si es un reclamo o una queja." },
};
