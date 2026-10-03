import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { catalogFixtures } from "@/modules/catalog/infrastructure/fixtures";
import { describeTrustPage } from "../_legal/trust-page-checks";
import HowWeChoosePage, { generateMetadata } from "./page";
import { RUBRIC_CRITERIA } from "./rubric-criteria";

describeTrustPage({
  path: "/como-elegimos",
  Page: HowWeChoosePage,
  metadata: generateMetadata,
  title: "Cómo elegimos",
  legal: false,
});

describe("/como-elegimos", () => {
  it("explains every criterion our reviews use", () => {
    const used = new Set(
      catalogFixtures.products.flatMap(
        (product) =>
          product.expertReview?.rubric.map((item) => item.criterion) ?? [],
      ),
    );
    const explained = new Set(
      RUBRIC_CRITERIA.flatMap(({ criteria }) => criteria),
    );
    expect([...used].filter((criterion) => !explained.has(criterion))).toEqual(
      [],
    );

    render(<HowWeChoosePage />);
    const table = screen.getByRole("table", {
      name: "Criterios de evaluación por categoría",
    });
    for (const criterion of used) {
      expect(table).toHaveTextContent(criterion);
    }
  });

  it("shows the 1-to-5 scale with the LED dots of the product page", () => {
    render(<HowWeChoosePage />);
    const scale = screen.getByRole("table", { name: "Escala de puntajes" });
    expect(
      within(scale)
        .getAllByRole("img")
        .map((dots) => dots.getAttribute("aria-label")),
    ).toEqual(["5 de 5", "4 de 5", "3 de 5", "2 de 5", "1 de 5"]);
  });
});
