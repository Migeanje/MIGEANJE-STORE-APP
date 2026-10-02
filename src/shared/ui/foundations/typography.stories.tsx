import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Code,
  DocPage,
  DocSection,
  MISSING_VALUE,
  useCssVars,
} from "./doc-blocks";

// Class names are written in full so Tailwind detects (and emits) every step.
const SCALE = [
  {
    token: "display-xl",
    className: "text-display-xl",
    use: "Hero headline. Geist Sans 500, tight tracking.",
    sample: "Carga sin pausa",
  },
  {
    token: "display-l",
    className: "text-display-l",
    use: "Section and page headlines. Geist Sans 500.",
    sample: "Tu equipo, siempre listo",
  },
  {
    token: "title",
    className: "text-title",
    use: "Product names, card and panel titles. Geist Sans 500.",
    sample: "Power bank de 20 000 mAh",
  },
  {
    token: "body",
    className: "text-body",
    use: "Running text. Geist Sans 400.",
    sample:
      "Elige el accesorio que tu equipo necesita y revisa cada detalle antes de comprar. Si tienes dudas, te ayudamos a decidir.",
  },
  {
    token: "body-sm",
    className: "text-body-sm",
    use: "Secondary text, form help, dense lists.",
    sample: "Compara especificaciones con calma: aquí tienes toda la ficha.",
  },
  {
    token: "caption",
    className: "text-caption",
    use: "Labels and fine print.",
    sample: "Precio incluye IGV",
  },
] as const;

const MONO_SAMPLES = [
  "20 000 mAh · 65 W · USB-C",
  "En importación · llega en 15–20 días",
  "Pedido N.º 000128 · SKU PB-20K-65W",
];

const SIZE_VARS = SCALE.map((step) => `--text-${step.token}`);
const LINE_HEIGHT_VARS = SCALE.map(
  (step) => `--text-${step.token}--line-height`,
);

function TypeScale() {
  const values = useCssVars([...SIZE_VARS, ...LINE_HEIGHT_VARS]);
  return (
    <DocPage
      title="Typography"
      intro="Two extremes: large, tight display type against small, calm body text. Display sizes are fluid between 320px and 1280px viewports."
    >
      <DocSection
        title="Scale"
        description="Use the Tailwind utility (text-display-xl…text-caption); it sets size, line height, tracking and, for display steps, weight 500."
      >
        <div className="flex flex-col">
          {SCALE.map((step) => (
            <div
              key={step.token}
              className="grid gap-3 border-b py-6 lg:grid-cols-[16rem_1fr] lg:gap-8"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-medium">
                  {step.className}
                </span>
                <Code>
                  {`--text-${step.token}: ${values[`--text-${step.token}`] || MISSING_VALUE}`}
                </Code>
                <Code>
                  {`line-height: ${values[`--text-${step.token}--line-height`] || MISSING_VALUE}`}
                </Code>
                <span className="text-caption text-muted-foreground">
                  {step.use}
                </span>
              </div>
              <p className={`${step.className} text-pretty`}>{step.sample}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}

function DataType() {
  return (
    <DocPage
      title="Data type"
      intro="Geist Mono is for data only: specs, lead times, order numbers and SKUs. Never for headlines or running text."
    >
      <DocSection
        title="Geist Mono samples"
        description="font-mono, body and body-sm sizes."
      >
        <ul className="flex flex-col gap-4">
          {MONO_SAMPLES.map((sample) => (
            <li key={sample} className="flex flex-col gap-1">
              <span className="font-mono text-body">{sample}</span>
              <span className="font-mono text-body-sm text-muted-foreground">
                {sample}
              </span>
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection
        title="In context"
        description="Sans for the name, mono for the data line."
      >
        <article className="flex max-w-md flex-col gap-2 rounded-lg border bg-card p-5">
          <h3 className="text-title">Power bank de 20 000 mAh</h3>
          <p className="font-mono text-body-sm text-muted-foreground">
            20 000 mAh · 65 W · USB-C
          </p>
          <p className="text-body-sm text-muted-foreground">
            Carga tu laptop y tu celular a la vez, donde estés.
          </p>
        </article>
      </DocSection>
    </DocPage>
  );
}

const meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Geist Sans (UI and display, weight 500 for display) and Geist Mono (data only), self-hosted through the `geist` package. Sample copy is neutral Peruvian Spanish using tú.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = { render: () => <TypeScale /> };

export const Data: Story = { render: () => <DataType /> };
