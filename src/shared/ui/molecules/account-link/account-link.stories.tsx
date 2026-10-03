import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AccountLink } from "./account-link";

const meta = {
  title: "Molecules/AccountLink",
  component: AccountLink,
  tags: ["autodocs"],
  args: { href: "/cuenta" },
  parameters: {
    docs: {
      description: {
        component:
          'The header account control: a person icon named "Mi cuenta" for guests; for a signed-in customer the first name shows from `sm` and is always part of the accessible name ("Mi cuenta, Lucía").',
      },
    },
  },
} satisfies Meta<typeof AccountLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {};

export const SignedIn: Story = {
  name: "Signed in",
  args: { firstName: "Lucía" },
};

export const LongName: Story = {
  name: "Long first name (truncated)",
  args: { firstName: "Maximiliano Alejandro" },
};
