import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { AvailabilityIndicator } from "./availability-indicator";

const CASES = [
  { status: "in_stock", label: "En stock" },
  { status: "backorder", label: "En importación · llega en 15–20 días" },
  { status: "unavailable", label: "Agotado" },
] as const;

describe("AvailabilityIndicator", () => {
  it.each(CASES)("shows the $status label as text", ({ status, label }) => {
    render(
      <AvailabilityIndicator status={status}>{label}</AvailabilityIndicator>,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each(CASES)("exposes data-status=$status", ({ status, label }) => {
    render(
      <AvailabilityIndicator status={status}>{label}</AvailabilityIndicator>,
    );

    expect(screen.getByText(label).closest("[data-status]")).toHaveAttribute(
      "data-status",
      status,
    );
  });

  it.each(CASES)(
    "hides the LED dot from the accessibility tree ($status)",
    ({ status, label }) => {
      render(
        <AvailabilityIndicator status={status}>{label}</AvailabilityIndicator>,
      );
      const root = screen.getByText(label).closest("[data-status]");

      const led = root?.querySelector('[data-slot="led"]');
      expect(led).toHaveAttribute("aria-hidden", "true");
      expect(led).toBeEmptyDOMElement();
      // Color is never the only signal: the label is the whole text content.
      expect(root?.textContent).toBe(label);
    },
  );

  it("forwards extra props and lets callers override the label size", () => {
    render(
      <AvailabilityIndicator
        status="in_stock"
        id="availability"
        className="text-caption"
      >
        En stock
      </AvailabilityIndicator>,
    );
    const root = screen.getByText("En stock").closest("[data-status]");

    expect(root).toHaveAttribute("id", "availability");
    expect(root).toHaveClass("text-caption");
    expect(root).not.toHaveClass("text-body-sm");
  });

  it.each(CASES)(
    "has no axe violations as $status",
    async ({ status, label }) => {
      const { container } = render(
        <AvailabilityIndicator status={status}>{label}</AvailabilityIndicator>,
      );

      await expectNoAxeViolations(container);
    },
  );
});
