import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { ScrollReveal } from "./scroll-reveal";

const meta = {
  title: "Organisms/ScrollReveal",
  component: ScrollReveal,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Fades and lifts a section in the first time it scrolls into view (`--duration-slow`, ease-out), with GSAP ScrollTrigger under `gsap.matchMedia()`. Never hides content that is already on screen; does nothing under reduced motion or before hydration. Scroll the canvas to see the lower sections reveal.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-[60vh] py-[20vh]">
      {["Destacados", "Explora por categoría", "Por qué Migeanje"].map(
        (title) => (
          <ScrollReveal key={title}>
            <section className="flex flex-col gap-2 rounded-lg border bg-card p-8">
              <Heading level={2}>{title}</Heading>
              <Text tone="muted">Esta sección aparece al hacer scroll.</Text>
            </section>
          </ScrollReveal>
        ),
      )}
    </div>
  ),
} satisfies Meta<typeof ScrollReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sections: Story = {};
