import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { COLOR_GROUP, CONFIG_GROUPS } from "./__fixtures__/groups";
import { VariantSelector } from "./variant-selector";

describe("VariantSelector", () => {
  it("renders one group per option, named by the option", () => {
    render(<VariantSelector groups={[COLOR_GROUP, ...CONFIG_GROUPS]} />);

    expect(screen.getAllByRole("group")).toHaveLength(3);
    expect(screen.getByRole("group", { name: "Color" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Memoria unificada" }),
    ).toBeInTheDocument();
  });

  it("shows the selected value as text and as the current link", () => {
    render(<VariantSelector groups={[COLOR_GROUP]} />);

    const group = screen.getByRole("group", { name: "Color" });
    expect(group).toHaveTextContent("Color: Negro");
    const current = within(group).getByRole("link", { name: "Negro" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveAttribute("href", "/productos/nano-charger");
  });

  it("links every value that can be chosen to its variant", () => {
    render(<VariantSelector groups={[COLOR_GROUP]} />);

    const link = screen.getByRole("link", { name: "Blanco" });
    expect(link).toHaveAttribute(
      "href",
      "/productos/nano-charger?variante=ank-a121d-wht",
    );
    expect(link).not.toHaveAttribute("aria-current");
  });

  it("does not link a value that cannot be chosen, and says why", () => {
    render(<VariantSelector groups={CONFIG_GROUPS} />);

    expect(screen.queryByRole("link", { name: /24 GB/ })).toBeNull();
    const group = screen.getByRole("group", { name: "Memoria unificada" });
    expect(group).toHaveTextContent("24 GB (no disponible)");
    expect(group).toHaveTextContent(
      "24 GB: No disponible con chip M5 (CPU de 10 núcleos, GPU de 8 núcleos)",
    );
  });

  it("shows an optional swatch next to the value text", () => {
    const { container } = render(
      <VariantSelector
        groups={[
          {
            ...COLOR_GROUP,
            values: [
              {
                value: "Negro",
                selected: true,
                href: "/p",
                swatch: "var(--foreground)",
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Negro" })).toBeInTheDocument();
    expect(
      container.querySelector<HTMLElement>("[data-slot=swatch]")?.style
        .backgroundColor,
    ).toBe("var(--foreground)");
  });

  it("renders nothing without options", () => {
    const { container } = render(<VariantSelector groups={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <VariantSelector groups={[COLOR_GROUP, ...CONFIG_GROUPS]} />,
    );

    await expectNoAxeViolations(container);
  });
});
