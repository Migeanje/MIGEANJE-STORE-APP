import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/(discovery)/page";
import { expectNoAxeViolations } from "@/test/a11y";

describe("HomePage", () => {
  it("renders the store name as the main heading", async () => {
    const { container } = render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Migeanje Store" }),
    ).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
