import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { LedScore } from "./led-score";

describe("LedScore", () => {
  it("is one image named by the score, with the score as visible text", () => {
    const { container } = render(<LedScore score={4} />);

    expect(screen.getByRole("img", { name: "4 de 5" })).toBeInTheDocument();
    expect(container).toHaveTextContent("4/5");
  });

  it("lights as many dots as the score", () => {
    const { container } = render(<LedScore score={2} max={3} />);

    const dots = container.querySelectorAll("[data-lit]");
    expect([...dots].map((dot) => dot.getAttribute("data-lit"))).toEqual([
      "true",
      "true",
      "false",
    ]);
  });

  it.each([0, 5])("accepts the bounds (%i)", (score) => {
    render(<LedScore score={score} />);

    expect(
      screen.getByRole("img", { name: `${score} de 5` }),
    ).toBeInTheDocument();
  });

  it.each([
    [{ score: 6 }],
    [{ score: -1 }],
    [{ score: 2.5 }],
    [{ score: 1, max: 0 }],
    [{ score: 1, max: 11 }],
  ])("throws a RangeError for %j", (props) => {
    expect(() => render(<LedScore {...props} />)).toThrow(RangeError);
  });

  it("has no axe violations", async () => {
    const { container } = render(<LedScore score={3} />);

    await expectNoAxeViolations(container);
  });
});
