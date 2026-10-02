import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { type Spec, SpecList } from "./spec-list";

const NBSP = " ";

const CHARGER: Spec[] = [
  { label: "Potencia máxima", value: 65, unit: "W" },
  { label: "Puertos", value: "2 × USB-C, 1 × USB-A" },
  { label: "Tecnología", value: "GaN" },
  { label: "Peso", value: 112, unit: "g" },
];

function pairs() {
  return screen.getAllByRole("term").map((term) => ({
    term: term.textContent,
    definition: term.nextElementSibling?.textContent,
    definitionTag: term.nextElementSibling?.tagName,
  }));
}

describe("SpecList", () => {
  it("renders a description list with one term and definition per spec, in order", () => {
    const { container } = render(<SpecList specs={CHARGER} />);

    // dt/dd have the term/definition roles but no name from content.
    expect(container.querySelector("dl")).toContainElement(
      screen.getByText("Peso"),
    );
    expect(screen.getAllByRole("term")).toHaveLength(4);
    expect(screen.getAllByRole("definition")).toHaveLength(4);
    expect(pairs()).toEqual([
      {
        term: "Potencia máxima",
        definition: `65${NBSP}W`,
        definitionTag: "DD",
      },
      {
        term: "Puertos",
        definition: "2 × USB-C, 1 × USB-A",
        definitionTag: "DD",
      },
      { term: "Tecnología", definition: "GaN", definitionTag: "DD" },
      { term: "Peso", definition: `112${NBSP}g`, definitionTag: "DD" },
    ]);
  });

  it("joins the value and its unit with a no-break space", () => {
    render(
      <SpecList
        specs={[{ label: "Capacidad", value: "20 000", unit: "mAh" }]}
      />,
    );

    expect(screen.getByRole("definition").textContent).toBe(`20 000${NBSP}mAh`);
  });

  it("shows labels muted and values in Geist Mono", () => {
    render(<SpecList specs={CHARGER} />);

    for (const term of screen.getAllByRole("term")) {
      expect(term).toHaveClass("text-muted-foreground");
      expect(term).not.toHaveClass("font-mono");
    }
    for (const definition of screen.getAllByRole("definition")) {
      expect(definition).toHaveClass("font-mono", "text-foreground");
    }
  });

  it("uses full rows with dividers by default", () => {
    const { container } = render(<SpecList specs={CHARGER} />);

    const list = container.querySelector("dl");
    expect(list).toHaveAttribute("data-variant", "full");
    expect(list).toHaveClass("divide-y", "divide-border");
  });

  it("lays the specs out in two columns when compact", () => {
    const { container } = render(
      <SpecList specs={CHARGER} variant="compact" />,
    );

    const list = container.querySelector("dl");
    expect(list).toHaveAttribute("data-variant", "compact");
    expect(list).toHaveClass("grid", "grid-cols-2");
    expect(list).not.toHaveClass("divide-y");
  });

  it("renders nothing without specs", () => {
    const { container } = render(<SpecList specs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("forwards native props and merges className", () => {
    const { container } = render(
      <SpecList
        specs={CHARGER}
        aria-label="Especificaciones"
        className="mt-6"
      />,
    );

    const list = container.querySelector("dl");
    expect(list).toHaveAttribute("aria-label", "Especificaciones");
    expect(list).toHaveClass("mt-6", "divide-y");
  });

  it.each(["full", "compact"] as const)(
    "has no axe violations as %s",
    async (variant) => {
      const { container } = render(
        <SpecList specs={CHARGER} variant={variant} />,
      );

      await expectNoAxeViolations(container);
    },
  );
});
