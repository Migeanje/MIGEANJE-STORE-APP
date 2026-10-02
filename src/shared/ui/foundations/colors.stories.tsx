import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { contrastRatio } from "../tokens/contrast";
import { toHexColor } from "./css-vars";
import { DocPage, DocSection, Swatch, useCssVars } from "./doc-blocks";

// Every color token in tokens.css `:root`, grouped by role. Values are read
// from the live stylesheet; this file never holds a color literal.

type TokenDoc = { name: string; note: string };
type TokenGroup = { title: string; description: string; tokens: TokenDoc[] };

const GROUPS: TokenGroup[] = [
  {
    title: "Surfaces",
    description:
      "Darkest to lightest. Aliases keep the shadcn/ui names so restyled primitives drop in.",
    tokens: [
      { name: "background", note: "Page background." },
      { name: "card", note: "Cards and panels." },
      { name: "surface-raised", note: "Raised elements, hover states." },
      { name: "popover", note: "Alias of card." },
      { name: "secondary", note: "Alias of surface-raised." },
      { name: "muted", note: "Alias of surface-raised." },
      {
        name: "accent",
        note: "shadcn hover surface (alias of surface-raised). Not the brand.",
      },
    ],
  },
  {
    title: "Text",
    description: "Both levels pass 4.5:1 on every surface.",
    tokens: [
      { name: "foreground", note: "Primary text." },
      { name: "muted-foreground", note: "Secondary text and captions." },
      { name: "card-foreground", note: "Alias of foreground." },
      { name: "popover-foreground", note: "Alias of foreground." },
      { name: "secondary-foreground", note: "Alias of foreground." },
      { name: "accent-foreground", note: "Alias of foreground." },
    ],
  },
  {
    title: "Brand",
    description:
      "Warm LED amber is the only UI accent: CTAs, focus, selection and the lit LED.",
    tokens: [
      { name: "primary", note: "Brand amber." },
      { name: "primary-foreground", note: "Text on primary." },
      { name: "ring", note: "Focus ring (alias of primary)." },
      { name: "glow", note: '"Encendido" glow: primary at 45%.' },
    ],
  },
  {
    title: "Status",
    description:
      "Errors use destructive. No green and no amber warnings in UI tokens.",
    tokens: [
      { name: "destructive", note: "Errors and destructive actions." },
      { name: "destructive-foreground", note: "Text on destructive." },
      {
        name: "led-off",
        note: "Unavailable LED ring. Non-text only (fails 4.5:1 on surface-raised).",
      },
    ],
  },
  {
    title: "Borders",
    description:
      "Decorative lines are exempt from 1.4.11; form fields are not.",
    tokens: [
      { name: "border", note: "Dividers and card outlines (decorative)." },
      { name: "input", note: "Form field borders (at least 3:1)." },
    ],
  },
];

type ContrastPair = { fg: string; bg: string };

const SURFACES = ["background", "card", "surface-raised"];
const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;

// Same allowed pairs as tokens.test.ts (aliases collapsed to their source).
const TEXT_PAIRS: ContrastPair[] = [
  "foreground",
  "muted-foreground",
  "primary",
  "destructive",
].flatMap((fg) => SURFACES.map((bg) => ({ fg, bg })));

const FILLED_PAIRS: ContrastPair[] = [
  { fg: "primary-foreground", bg: "primary" },
  { fg: "destructive-foreground", bg: "destructive" },
];

const NON_TEXT_PAIRS: ContrastPair[] = [
  ...SURFACES.map((bg) => ({ fg: "ring", bg })),
  ...SURFACES.map((bg) => ({ fg: "led-off", bg })),
  { fg: "input", bg: "background" },
  { fg: "input", bg: "card" },
];

const cssVar = (name: string) => `--${name}`;

const ALL_COLOR_VARS = GROUPS.flatMap((group) =>
  group.tokens.map((token) => cssVar(token.name)),
);

function ratioOf(values: Record<string, string>, pair: ContrastPair) {
  const fg = toHexColor(values[cssVar(pair.fg)] ?? "");
  const bg = toHexColor(values[cssVar(pair.bg)] ?? "");
  return fg && bg ? contrastRatio(fg, bg) : null;
}

function ColorPalette() {
  const values = useCssVars(ALL_COLOR_VARS);
  return (
    <DocPage
      title="Colors"
      intro="Semantic dark tokens with shadcn/ui names. Components use the Tailwind utilities (bg-card, text-muted-foreground); never raw color values."
    >
      {GROUPS.map((group) => (
        <DocSection
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {group.tokens.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                variable={cssVar(token.name)}
                value={values[cssVar(token.name)] ?? ""}
                note={token.note}
              />
            ))}
          </div>
        </DocSection>
      ))}
    </DocPage>
  );
}

function ContrastSample({
  pair,
  kind,
}: {
  pair: ContrastPair;
  kind: "text" | "non-text";
}) {
  return (
    <span
      className="inline-flex items-center rounded-sm border px-3 py-2"
      style={{ background: `var(${cssVar(pair.bg)})` }}
    >
      {kind === "text" ? (
        <span
          className="text-body-sm font-medium whitespace-nowrap"
          style={{ color: `var(${cssVar(pair.fg)})` }}
        >
          S/ 129.90
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="block size-5 rounded-full border-2"
          style={{ borderColor: `var(${cssVar(pair.fg)})` }}
        />
      )}
    </span>
  );
}

function ContrastTable({
  caption,
  pairs,
  kind,
  values,
}: {
  caption: string;
  pairs: ContrastPair[];
  kind: "text" | "non-text";
  values: Record<string, string>;
}) {
  const min = kind === "text" ? TEXT_MIN : NON_TEXT_MIN;
  return (
    <table className="w-full border-collapse text-left text-body-sm">
      <caption className="pb-3 text-left text-caption text-muted-foreground">
        {`${caption}. AA needs ${min}:1.`}
      </caption>
      <thead>
        <tr className="border-b">
          <th scope="col" className="py-2 pr-3 font-medium sm:pr-4">
            Token pair
          </th>
          <th scope="col" className="py-2 pr-3 font-medium sm:pr-4">
            Sample
          </th>
          <th scope="col" className="py-2 pr-3 font-medium sm:pr-4">
            Ratio
          </th>
          <th scope="col" className="py-2 font-medium">
            AA
          </th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair) => {
          const ratio = ratioOf(values, pair);
          const passes = ratio !== null && ratio >= min;
          return (
            <tr key={`${pair.fg}/${pair.bg}`} className="border-b">
              <th scope="row" className="py-3 pr-3 font-normal sm:pr-4">
                <span className="flex flex-col">
                  <span>{pair.fg}</span>
                  <span className="text-caption text-muted-foreground">
                    on {pair.bg}
                  </span>
                </span>
              </th>
              <td className="py-3 pr-3 sm:pr-4">
                <ContrastSample pair={pair} kind={kind} />
              </td>
              <td className="py-3 pr-3 font-mono sm:pr-4">
                {ratio === null ? "n/a" : `${ratio.toFixed(2)}:1`}
              </td>
              <td
                className={`py-3 font-medium ${passes ? "text-foreground" : "text-destructive"}`}
              >
                {passes ? "Pass" : "Fail"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ContrastReport() {
  const values = useCssVars(ALL_COLOR_VARS);
  return (
    <DocPage
      title="Contrast"
      intro="WCAG 2.2 AA ratios computed at runtime from the live tokens with contrast.ts. tokens.test.ts enforces the same pairs in CI."
    >
      <DocSection
        title="Text on surfaces"
        description="SC 1.4.3: body text needs 4.5:1. The brand amber is allowed as text (links, selected labels)."
      >
        <ContrastTable
          caption="Text tokens on every surface"
          pairs={TEXT_PAIRS}
          kind="text"
          values={values}
        />
      </DocSection>
      <DocSection title="Text on filled colors">
        <ContrastTable
          caption="Foreground tokens on their filled backgrounds"
          pairs={FILLED_PAIRS}
          kind="text"
          values={values}
        />
      </DocSection>
      <DocSection
        title="Non-text"
        description="SC 1.4.11: focus ring, LED rings and form field borders need 3:1. Decorative borders are exempt."
      >
        <ContrastTable
          caption="Non-text tokens on surfaces"
          pairs={NON_TEXT_PAIRS}
          kind="non-text"
          values={values}
        />
      </DocSection>
    </DocPage>
  );
}

const meta = {
  title: "Foundations/Colors",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Color tokens from `src/shared/ui/tokens/tokens.css`, read from the computed styles. Dark-only MVP: a light theme would only redefine the `:root` values.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = { render: () => <ColorPalette /> };

export const Contrast: Story = { render: () => <ContrastReport /> };
