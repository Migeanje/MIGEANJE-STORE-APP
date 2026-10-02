import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Code,
  DocPage,
  DocSection,
  MISSING_VALUE,
  useCssVars,
} from "./doc-blocks";

// Class names are written in full so Tailwind detects (and emits) every radius.
const RADII = [
  { token: "sm", className: "rounded-sm", shape: "w-24", use: "Tags, chips." },
  {
    token: "md",
    className: "rounded-md",
    shape: "w-24",
    use: "Inputs, thumbnails.",
  },
  {
    token: "lg",
    className: "rounded-lg",
    shape: "w-24",
    use: "Cards, panels, cart.",
  },
  {
    token: "pill",
    className: "rounded-pill",
    shape: "w-40",
    use: "Buttons, any non-square pill.",
  },
  {
    token: "full",
    className: "rounded-full",
    shape: "w-24",
    use: "Circles: LED dot, avatars (square elements only).",
  },
] as const;

function RadiusScale() {
  const values = useCssVars(RADII.map((radius) => `--radius-${radius.token}`));
  return (
    <DocPage
      title="Radii"
      intro="Five radii, nothing else: Tailwind's default radii are reset. Nested corners stay concentric."
    >
      <DocSection title="Scale">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {RADII.map((radius) => (
            <figure key={radius.token} className="flex flex-col gap-3">
              <div
                aria-hidden="true"
                className={`${radius.className} ${radius.shape} h-24 border-2 border-input bg-surface-raised`}
              />
              <figcaption className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">
                  {radius.className}
                </span>
                <Code>
                  {`--radius-${radius.token}: ${values[`--radius-${radius.token}`] || MISSING_VALUE}`}
                </Code>
                <span className="text-caption text-muted-foreground">
                  {radius.use}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </DocSection>
      <DocSection
        title="Concentric corners"
        description="Inner radius = outer radius − padding. A card with rounded-lg (20px) and p-2 (8px) gives its image rounded-md (12px)."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <figure className="flex flex-col gap-3">
            <div className="rounded-lg border bg-card p-2">
              <div
                aria-hidden="true"
                className="h-40 rounded-md bg-surface-raised"
              />
              <p className="px-2 pt-3 pb-1 text-body-sm">
                Audífonos inalámbricos
              </p>
            </div>
            <figcaption className="flex flex-col gap-1">
              <span className="text-body-sm font-medium">
                Right: concentric
              </span>
              <Code>rounded-lg + p-2 → inner rounded-md (20 − 8 = 12px)</Code>
            </figcaption>
          </figure>
          <figure className="flex flex-col gap-3">
            <div className="rounded-lg border bg-card p-2">
              <div
                aria-hidden="true"
                className="h-40 rounded-lg bg-surface-raised"
              />
              <p className="px-2 pt-3 pb-1 text-body-sm">
                Audífonos inalámbricos
              </p>
            </div>
            <figcaption className="flex flex-col gap-1">
              <span className="text-body-sm font-medium text-destructive">
                Wrong: same radius inside
              </span>
              <Code>rounded-lg + p-2 → inner rounded-lg (corners bulge)</Code>
            </figcaption>
          </figure>
        </div>
      </DocSection>
    </DocPage>
  );
}

const meta = {
  title: "Foundations/Radii",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "`rounded-sm|md|lg|pill|full`. `full` is 50% (circles for square elements); use `pill` for buttons.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = { render: () => <RadiusScale /> };
