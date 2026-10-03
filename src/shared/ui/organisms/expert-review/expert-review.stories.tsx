import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SAMPLE_REVIEW } from "./__fixtures__/review";
import { ExpertReview } from "./expert-review";

const meta = {
  title: "Organisms/ExpertReview",
  component: ExpertReview,
  tags: ["autodocs"],
  args: SAMPLE_REVIEW,
  argTypes: {
    rubric: { control: false },
    headingLevel: { control: "inline-radio", options: [2, 3, 4] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Our opinion on a product (product page): the verdict, «Para quién es» / «Para quién no es» lists and the rubric, each criterion scored from 1 to 5 as LED dots with a visible 4/5 and a short note. Products without a review render no section at all (the page decides).",
      },
    },
  },
} satisfies Meta<typeof ExpertReview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortReview: Story = {
  args: {
    verdict: "Compacto y potente para un solo equipo.",
    forWhom: ["Cargas un celular y una tablet"],
    notFor: ["Necesitas cargar una laptop"],
    rubric: [
      { criterion: "Potencia", score: 3, note: "45 W en un solo puerto." },
    ],
  },
};
