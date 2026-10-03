import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { HomeHero } from "./home-hero";

const PROPS = {
  headline: "Tecnología elegida con criterio",
  lead: "Solo lo que le recomendaríamos a un amigo.",
  cta: { href: "/categorias/cargadores", label: "Ver cargadores" },
};

describe("HomeHero", () => {
  it("renders the headline as the page heading, the lead and the call to action", () => {
    render(<HomeHero {...PROPS} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Tecnología elegida con criterio",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Solo lo que le recomendaríamos a un amigo."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver cargadores" }),
    ).toHaveAttribute("href", "/categorias/cargadores");
  });

  it("is a region named by its heading", () => {
    render(<HomeHero {...PROPS} />);

    expect(
      screen.getByRole("region", { name: "Tecnología elegida con criterio" }),
    ).toBeInTheDocument();
  });

  it("warms up its glow with CSS only: content is visible from the first frame", () => {
    const { container } = render(<HomeHero {...PROPS} />);

    const glow = container.querySelector("[data-slot='glow']");
    expect(glow).toHaveAttribute("aria-hidden", "true");
    // The glow ramps in over the story duration (instant with reduced motion).
    expect(glow).toHaveClass(
      "starting:opacity-0",
      "duration-(--duration-story)",
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveClass(
      "opacity-0",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<HomeHero {...PROPS} />);

    await expectNoAxeViolations(container);
  });
});
