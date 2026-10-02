import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  Code,
  DocPage,
  DocSection,
  MISSING_VALUE,
  useCssVars,
  usePrefersReducedMotion,
} from "./doc-blocks";

// Class names are written in full so Tailwind detects them.
const DURATIONS = [
  {
    token: "--duration-fast",
    className: "duration-(--duration-fast)",
    use: "LED, hover, the encendido glow.",
  },
  {
    token: "--duration-base",
    className: "duration-(--duration-base)",
    use: "Drawers, toggles.",
  },
  {
    token: "--duration-slow",
    className: "duration-(--duration-slow)",
    use: "Section reveal.",
  },
  {
    token: "--duration-story",
    className: "duration-(--duration-story)",
    use: "Hero only.",
  },
] as const;

const EASINGS = [
  {
    token: "--ease-out",
    className: "ease-out",
    use: "Entries and reveals (default for plain `transition`).",
  },
  { token: "--ease-in-out", className: "ease-in-out", use: "Drawers." },
] as const;

const GLOW_BUTTON =
  "rounded-pill bg-primary px-6 py-3 text-body font-medium text-primary-foreground transition-shadow ease-out";

function PlayButton({
  playing,
  onToggle,
}: {
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="self-start rounded-pill border border-input px-5 py-2 text-body-sm font-medium transition-colors hover:bg-surface-raised"
    >
      {playing ? "Reset" : "Play"}
    </button>
  );
}

function Track({
  playing,
  className,
}: {
  playing: boolean;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="block h-2 rounded-pill bg-surface-raised"
    >
      <span
        className={`block h-2 origin-left rounded-pill bg-primary transition-transform ${className} ${playing ? "scale-x-100" : "scale-x-0"}`}
      />
    </span>
  );
}

function MotionTokens() {
  const values = useCssVars([
    ...DURATIONS.map((duration) => duration.token),
    ...EASINGS.map((easing) => easing.token),
  ]);
  const [playing, setPlaying] = useState(false);
  const toggle = () => setPlaying((current) => !current);

  return (
    <DocPage
      title="Motion"
      intro="Few, short, purposeful. One signature gesture (encendido) and no loaders. Under reduced motion every state still changes, instantly."
    >
      <DocSection
        title="Durations"
        description="Use with duration-(--duration-base). Play fills each bar with ease-out."
      >
        <PlayButton playing={playing} onToggle={toggle} />
        <ul className="flex flex-col">
          {DURATIONS.map((duration) => (
            <li
              key={duration.token}
              className="grid gap-3 border-b py-4 sm:grid-cols-[16rem_1fr] sm:items-center"
            >
              <span className="flex flex-col gap-1">
                <Code>{`${duration.token}: ${values[duration.token] || MISSING_VALUE}`}</Code>
                <span className="text-caption text-muted-foreground">
                  {duration.use}
                </span>
              </span>
              <Track
                playing={playing}
                className={`${duration.className} ease-out`}
              />
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection
        title="Easing"
        description="Both bars run on --duration-slow so the curves are easy to compare."
      >
        <ul className="flex flex-col">
          {EASINGS.map((easing) => (
            <li
              key={easing.token}
              className="grid gap-3 border-b py-4 sm:grid-cols-[16rem_1fr] sm:items-center"
            >
              <span className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">
                  {easing.className}
                </span>
                <Code>{`${easing.token}: ${values[easing.token] || MISSING_VALUE}`}</Code>
                <span className="text-caption text-muted-foreground">
                  {easing.use}
                </span>
              </span>
              <Track
                playing={playing}
                className={`duration-(--duration-slow) ${easing.className}`}
              />
            </li>
          ))}
        </ul>
      </DocSection>
    </DocPage>
  );
}

function Encendido() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <DocPage
      title="Encendido"
      intro="The signature gesture: a soft amber glow turns on behind the active element at hover, focus or selection, using --duration-fast and --ease-out."
    >
      <DocSection
        title="Glow on hover and focus"
        description="Hover or tab to the first button. The second one shows the lit state for comparison."
      >
        <div className="flex flex-wrap items-start gap-8 rounded-lg border bg-card p-8">
          <figure className="flex flex-col items-start gap-3">
            <button
              type="button"
              className={`${GLOW_BUTTON} duration-(--duration-fast) hover:shadow-glow focus-visible:shadow-glow`}
            >
              Agregar al carrito
            </button>
            <figcaption>
              <Code>Hover or focus me</Code>
            </figcaption>
          </figure>
          <figure className="flex flex-col items-start gap-3">
            <span className={`${GLOW_BUTTON} shadow-glow`}>
              Agregar al carrito
            </span>
            <figcaption>
              <Code>Lit state (static)</Code>
            </figcaption>
          </figure>
        </div>
        <Code>
          transition-shadow duration-(--duration-fast) ease-out
          hover:shadow-glow focus-visible:shadow-glow
        </Code>
      </DocSection>
      <DocSection
        title="Reduced motion"
        description="With prefers-reduced-motion: reduce, the base layer in tokens.css cuts every transition to 0.01ms: the glow still turns on, without the fade. Emulate it in DevTools (Rendering → prefers-reduced-motion) to check the first button above."
      >
        <p className="text-body-sm">
          Your system right now:{" "}
          <span className="font-mono">
            {reducedMotion ? "reduce" : "no-preference"}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-8 rounded-lg border bg-card p-8">
          <figure className="flex flex-col items-start gap-3">
            <button
              type="button"
              className={`${GLOW_BUTTON} duration-0 hover:shadow-glow focus-visible:shadow-glow`}
            >
              Agregar al carrito
            </button>
            <figcaption>
              <Code>Simulated reduced motion: instant glow</Code>
            </figcaption>
          </figure>
        </div>
      </DocSection>
    </DocPage>
  );
}

const meta = {
  title: "Foundations/Motion",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Duration tokens live in `:root` (`--duration-fast|base|slow|story`), easings in `@theme` (`ease-out`, `ease-in-out`). Plain `transition` defaults to `--duration-fast` and `--ease-out`.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = { render: () => <MotionTokens /> };

export const Glow: Story = {
  name: "Encendido glow",
  render: () => <Encendido />,
};
