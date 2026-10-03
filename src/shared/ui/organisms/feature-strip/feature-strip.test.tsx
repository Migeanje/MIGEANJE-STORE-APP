import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { FeatureStrip } from "./feature-strip";

const ITEMS = [
  { title: "Curaduría", description: "Elegimos pocos productos." },
  { title: "Reseñas honestas", description: "Te decimos para quién no es." },
  { title: "Garantía local", description: "Lo resolvemos en Perú." },
];

describe("FeatureStrip", () => {
  it("is a region named by its heading, with one titled item per feature", () => {
    render(<FeatureStrip title="Por qué Migeanje" items={ITEMS} />);

    const region = screen.getByRole("region", { name: "Por qué Migeanje" });
    expect(within(region).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Por qué Migeanje",
    );
    expect(
      within(region)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Curaduría", "Reseñas honestas", "Garantía local"]);
    expect(within(region).getAllByRole("listitem")).toHaveLength(3);
    expect(
      within(region).getByText("Lo resolvemos en Perú."),
    ).toBeInTheDocument();
  });

  it("supports another outline level", () => {
    render(
      <FeatureStrip title="Por qué Migeanje" items={ITEMS} headingLevel={3} />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Por qué Migeanje" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <FeatureStrip title="Por qué Migeanje" items={ITEMS} />,
    );

    await expectNoAxeViolations(container);
  });
});
