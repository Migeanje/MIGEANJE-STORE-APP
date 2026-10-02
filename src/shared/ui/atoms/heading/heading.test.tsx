import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Heading } from "./heading";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;
const SIZES = ["display-xl", "display-l", "title"] as const;

describe("Heading", () => {
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
