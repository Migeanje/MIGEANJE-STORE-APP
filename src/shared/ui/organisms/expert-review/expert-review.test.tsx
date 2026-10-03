import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SAMPLE_REVIEW } from "./__fixtures__/review";
import { ExpertReview } from "./expert-review";

describe("ExpertReview", () => {
  it("is a region named by its title, with the verdict", () => {
    render(<ExpertReview {...SAMPLE_REVIEW} />);

    const region = screen.getByRole("region", { name: "Nuestra opinión" });
    expect(
      within(region).getByRole("heading", {
        level: 2,
        name: "Nuestra opinión",
      }),
    ).toBeInTheDocument();
    expect(region).toHaveTextContent(SAMPLE_REVIEW.verdict);
  });

  it("lists who it is for and who it is not for under their own headings", () => {
    render(<ExpertReview {...SAMPLE_REVIEW} />);

    expect(
      screen
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(["Para quién es", "Para quién no es", "Cómo lo evaluamos"]);
    const [forWhom, notFor] = screen.getAllByRole("list");
    expect(
      within(forWhom as HTMLElement).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(within(notFor as HTMLElement).getAllByRole("listitem")).toHaveLength(
      1,
    );
  });

  it("scores each criterion with LED dots, visible text and a note", () => {
    render(<ExpertReview {...SAMPLE_REVIEW} />);

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(
      ["Potencia", "Uso con varios equipos", "Portabilidad"],
    );
    const [first] = screen.getAllByRole("definition");
    expect(
      within(first as HTMLElement).getByRole("img", { name: "5 de 5" }),
    ).toBeInTheDocument();
    expect(first).toHaveTextContent("5/5");
    expect(first).toHaveTextContent(/alcanzan para la mayoría/);
  });

  it("supports another title and outline level", () => {
    render(<ExpertReview {...SAMPLE_REVIEW} title="Reseña" headingLevel={3} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Reseña" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(3);
  });

  it("has no axe violations", async () => {
    const { container } = render(<ExpertReview {...SAMPLE_REVIEW} />);

    await expectNoAxeViolations(container);
  });
});
