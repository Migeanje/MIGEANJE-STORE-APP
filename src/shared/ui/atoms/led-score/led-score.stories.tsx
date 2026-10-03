import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LedScore } from "./led-score";

const meta = {
  title: "Atoms/LedScore",
  component: LedScore,
  tags: ["autodocs"],
  args: { score: 4, max: 5 },
  argTypes: {
    score: { control: { type: "range", min: 0, max: 5, step: 1 } },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A score as LED dots (the expert review rubric): lit dots are amber with a glow, unlit ones are `led-off` rings, so shape and the visible "4/5" carry the meaning, not only color. Screen readers hear one image named "4 de 5".',
      },
    },
  },
} satisfies Meta<typeof LedScore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EveryScore: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((score) => (
        <LedScore key={score} score={score} />
      ))}
    </div>
  ),
};
