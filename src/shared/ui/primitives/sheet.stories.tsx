import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Button } from "@/shared/ui/atoms/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const meta = {
  title: "Primitives/Sheet",
  component: SheetContent,
  tags: ["autodocs"],
  args: { side: "right" },
  argTypes: {
    side: { control: "inline-radio", options: ["left", "right"] },
  },
  parameters: {
    docs: {
      description: {
        component:
          "shadcn/ui Sheet on Radix Dialog, restyled with our tokens: a modal side panel (`left` for the menu, `right` for the cart) over a dimmed overlay. Radix handles the focus trap, Escape, focus return to the trigger and scroll lock; the panel and overlay carry `data-lenis-prevent` so smooth scroll never moves the page behind them. It slides in with `--duration-base` (instant under reduced motion). Name it with `SheetTitle`.",
      },
    },
  },
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Abrir panel</Button>
      </SheetTrigger>
      <SheetContent {...args}>
        <SheetHeader>
          <SheetTitle>Panel</SheetTitle>
          <SheetDescription>
            Contenido de ejemplo para revisar el estilo del panel.
          </SheetDescription>
        </SheetHeader>
        <Button>Acción principal</Button>
      </SheetContent>
    </Sheet>
  ),
} satisfies Meta<typeof SheetContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  name: "Open (right)",
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Abrir panel" }),
    );
    // The panel renders in a portal on document.body.
    await expect(
      within(document.body).getByRole("dialog", { name: "Panel" }),
    ).toBeVisible();
  },
};

export const OpenLeft: Story = {
  name: "Open (left)",
  args: { side: "left" },
  play: Open.play,
};
