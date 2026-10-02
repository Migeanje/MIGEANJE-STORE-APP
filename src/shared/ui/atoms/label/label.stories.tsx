import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "../input";
import { Label } from "./label";

const meta = {
  title: "Atoms/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    htmlFor: "field",
    children: "Nombre completo",
    required: false,
  },
  argTypes: {
    required: { control: "boolean" },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Native `<label>` in `body-sm`. `required` adds a decorative asterisk plus a visually hidden "(obligatorio)", so the requirement is announced as text, not only as a symbol.',
      },
    },
  },
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label {...args} />
      <Input id={args.htmlFor} required={args.required} />
    </div>
  ),
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Optional: Story = {};

export const Required: Story = {
  args: { htmlFor: "email", children: "Correo electrónico", required: true },
};
