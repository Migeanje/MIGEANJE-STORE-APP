import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { AccountLink } from "./account-link";

describe("AccountLink", () => {
  it("is an icon link named 'Mi cuenta' for a guest", async () => {
    const { container } = render(<AccountLink href="/cuenta" />);

    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute(
      "href",
      "/cuenta",
    );
    await expectNoAxeViolations(container);
  });

  it("shows the first name of a signed-in customer", async () => {
    const { container } = render(
      <AccountLink href="/cuenta" firstName="Lucía" />,
    );

    const link = screen.getByRole("link", { name: "Mi cuenta, Lucía" });
    // The visible name (from `sm`) is part of the accessible name.
    expect(link).toHaveTextContent("Lucía");
    await expectNoAxeViolations(container);
  });

  it("treats a blank name like a guest", () => {
    render(<AccountLink href="/cuenta" firstName="  " />);
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeInTheDocument();
  });
});
