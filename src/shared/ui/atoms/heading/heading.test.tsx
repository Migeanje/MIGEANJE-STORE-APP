import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Heading, type HeadingLevel } from "./heading";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;
const SIZES = ["display-xl", "display-l", "title"] as const;

describe("Heading", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(LEVELS)("renders level %i as an h%i heading", (level) => {
    render(<Heading level={level}>Cargadores GaN</Heading>);

    const heading = screen.getByRole("heading", {
      level,
      name: "Cargadores GaN",
    });
    expect(heading.tagName).toBe(`H${level}`);
  });

  it("keeps the visual size independent from the semantic level", () => {
    render(
      <Heading level={3} size="display-xl">
        Energía para todo el día
      </Heading>,
    );

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("text-display-xl");
    expect(heading).not.toHaveClass("text-title");
  });

  it("defaults to the title size", () => {
    render(<Heading level={1}>Tu carrito</Heading>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("text-title");
  });

  it.each(SIZES)("uses the %s type token at weight 500", (size) => {
    render(
      <Heading level={2} size={size}>
        Accesorios premium
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      `text-${size}`,
      "font-medium",
    );
  });

  it("forwards native props and merges className", () => {
    render(
      <Heading level={2} id="destacados" className="text-muted-foreground">
        Destacados
      </Heading>,
    );
    const heading = screen.getByRole("heading", { level: 2 });

    expect(heading).toHaveAttribute("id", "destacados");
    expect(heading).toHaveClass("text-muted-foreground", "text-title");
    expect(heading).not.toHaveClass("text-foreground");
  });

  it.each([
    0,
    7,
    -1,
    2.5,
    Number.NaN,
  ])("throws a RangeError naming the allowed range for level %s", (level) => {
    // React logs the render error before rethrowing it; keep the output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Untyped data (CMS, JSON) can reach the component with any number.
    const renderHeading = () =>
      render(<Heading level={level as HeadingLevel}>Cargadores</Heading>);

    expect(renderHeading).toThrow(RangeError);
    expect(renderHeading).toThrow(
      `Heading level must be an integer from 1 to 6, got ${level}`,
    );
  });

  it("has no axe violations at every level and size", async () => {
    const { container } = render(
      <div>
        {LEVELS.map((level, index) => (
          <Heading key={level} level={level} size={SIZES[index % 3]}>
            Nivel {level}
          </Heading>
        ))}
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
