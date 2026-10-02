import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Code,
  DocPage,
  DocSection,
  MISSING_VALUE,
  useCssVars,
} from "./doc-blocks";

// The steps worth using for layout. Class names are written in full so
// Tailwind detects them.
const STEPS = [
  { step: 1, className: "w-1", use: "Icon to label nudges." },
  { step: 2, className: "w-2", use: "Tight inline gaps, tag padding." },
  { step: 3, className: "w-3", use: "Label to field, chip padding." },
  { step: 4, className: "w-4", use: "Page gutter on mobile, default gap." },
  { step: 6, className: "w-6", use: "Card padding, stacked groups." },
  { step: 8, className: "w-8", use: "Page gutter on desktop." },
  { step: 12, className: "w-12", use: "Between related sections." },
  { step: 16, className: "w-16", use: "Between page sections on mobile." },
  { step: 24, className: "w-24", use: "Between page sections on desktop." },
  { step: 32, className: "w-32", use: "Hero breathing room." },
] as const;

function SpacingScale() {
  const values = useCssVars(["--spacing"]);
  return (
    <DocPage
      title="Spacing"
      intro="Tailwind's 4px scale: every spacing utility (p-4, gap-6, mt-12…) is a multiple of the base step. Prefer the steps below for layout."
    >
      <DocSection
        title="Scale"
        description={
          <>
            A utility with step n is n × 4px. Base step:{" "}
            <Code>{`--spacing: ${values["--spacing"] || MISSING_VALUE}`}</Code>
          </>
        }
      >
        <ul className="flex flex-col">
          {STEPS.map(({ step, className, use }) => (
            <li
              key={step}
              className="grid grid-cols-[5rem_1fr] items-center gap-4 border-b py-3 sm:grid-cols-[5rem_9rem_1fr]"
            >
              <span className="flex flex-col">
                <span className="text-body-sm font-medium">{step}</span>
                <Code>{`${step * 4}px`}</Code>
              </span>
              <span
                aria-hidden="true"
                className={`${className} h-4 rounded-sm bg-primary`}
              />
              <span className="col-span-2 text-caption text-muted-foreground sm:col-span-1">
                {use}
              </span>
            </li>
          ))}
        </ul>
      </DocSection>
    </DocPage>
  );
}

const meta = {
  title: "Foundations/Spacing",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Spacing keeps Tailwind's 4px scale (`--spacing`). Mobile-first: start with the small steps and grow at `sm`/`lg`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = { render: () => <SpacingScale /> };
