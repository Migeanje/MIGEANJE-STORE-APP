import { getDefaultNormalizer, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Price } from "./price";

const NBSP = "\u00A0";
const SIZES = ["sm", "md", "lg"] as const;
// The default normalizer turns the NBSP into a plain space; keep it exact.
const EXACT = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
};

function rootOf(text: string): HTMLElement {
  const root = screen
    .getByText(text, EXACT)
    .closest<HTMLElement>('[data-slot="price"]');
  if (!root) throw new Error(`No price root around "${text}"`);
  return root;
}

describe("Price", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the amount in soles from céntimos", () => {
    render(<Price amount={12990} />);

    const root = rootOf(`S/${NBSP}129.90`);
    expect(root.textContent).toBe(`S/${NBSP}129.90`);
    expect(root.querySelector("s")).toBeNull();
  });

  it("shows a struck-through previous price that screen readers can tell apart", () => {
    render(<Price amount={12990} compareAt={15990} />);
    const root = rootOf(`S/${NBSP}129.90`);

    // Both prices carry visually hidden labels, not just two numbers.
    expect(root.textContent).toBe(
      `Precio actual: S/${NBSP}129.90 Precio anterior: S/${NBSP}159.90`,
    );
    for (const label of ["Precio actual:", "Precio anterior:"]) {
      expect(screen.getByText(label)).toHaveClass("sr-only");
    }
    // Only the previous price is struck through.
    expect(root.querySelector("s")?.textContent).toBe(
      `Precio anterior: S/${NBSP}159.90`,
    );
  });

  it.each([
    ["equal to", 12990],
    ["lower than", 9990],
  ])("hides compareAt when it is %s the amount", (_label, compareAt) => {
    render(<Price amount={12990} compareAt={compareAt} />);
    const root = rootOf(`S/${NBSP}129.90`);

    expect(root.textContent).toBe(`S/${NBSP}129.90`);
    expect(root.querySelector("s")).toBeNull();
  });

  it("uses Geist Sans with tabular figures", () => {
    render(<Price amount={4990} />);

    expect(rootOf(`S/${NBSP}49.90`)).toHaveClass("font-sans", "tabular-nums");
  });

  it.each([
    ["sm", "text-body-sm"],
    ["md", "text-body"],
    ["lg", "text-title"],
  ] as const)("uses the %s size token %s for the amount", (size, token) => {
    render(<Price amount={4990} size={size} />);

    expect(screen.getByText(`S/${NBSP}49.90`, EXACT)).toHaveClass(token);
  });

  it("forwards native props and merges className", () => {
    render(<Price amount={4990} id="precio" className="justify-end" />);
    const root = rootOf(`S/${NBSP}49.90`);

    expect(root).toHaveAttribute("id", "precio");
    expect(root).toHaveClass("justify-end", "tabular-nums");
  });

  it.each([
    ["amount", { amount: 129.9 }],
    ["amount", { amount: -100 }],
    ["compareAt", { amount: 12990, compareAt: Number.NaN }],
    ["compareAt", { amount: 12990, compareAt: -1 }],
  ])("throws a RangeError for an invalid %s", (_label, props) => {
    // React logs the render error before rethrowing it; keep the output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Price {...props} />)).toThrow(RangeError);
  });

  it.each(SIZES)("has no axe violations at size %s", async (size) => {
    const { container } = render(
      <div>
        <Price amount={12990} size={size} />
        <Price amount={12990} compareAt={15990} size={size} />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
