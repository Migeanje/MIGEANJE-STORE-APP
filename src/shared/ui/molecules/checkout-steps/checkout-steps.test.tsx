import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CheckoutSteps, type CheckoutStepsProps } from "./checkout-steps";

const STEPS: CheckoutStepsProps["steps"] = [
  {
    id: "contacto",
    label: "Contacto y envío",
    href: "/checkout/contacto",
    state: "complete",
  },
  {
    id: "comprobante",
    label: "Comprobante",
    href: "/checkout/comprobante",
    state: "current",
  },
  { id: "pago", label: "Pago", state: "upcoming" },
];

describe("CheckoutSteps", () => {
  it("is a labelled navigation with an ordered list of the steps", () => {
    render(<CheckoutSteps steps={STEPS} />);

    const nav = screen.getByRole("navigation", { name: "Pasos de la compra" });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(3);
  });

  it("links completed steps and says they are done", () => {
    render(<CheckoutSteps steps={STEPS} />);

    expect(
      screen.getByRole("link", {
        name: "Paso 1: Contacto y envío (completado)",
      }),
    ).toHaveAttribute("href", "/checkout/contacto");
  });

  it("marks the current step with aria-current=step and does not link it", () => {
    render(<CheckoutSteps steps={STEPS} />);

    const current = screen.getByText("Comprobante").closest("[aria-current]");
    expect(current).toHaveAttribute("aria-current", "step");
    expect(current?.tagName).not.toBe("A");
    expect(screen.queryByRole("link", { name: /Comprobante/ })).toBeNull();
  });

  it("does not link upcoming steps", () => {
    render(<CheckoutSteps steps={STEPS} />);
    expect(screen.queryByRole("link", { name: /Pago/ })).toBeNull();
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("throws a RangeError unless exactly one step is current", () => {
    expect(() =>
      render(
        <CheckoutSteps
          steps={STEPS.map((step) => ({ ...step, state: "upcoming" }))}
        />,
      ),
    ).toThrow(RangeError);
    expect(() =>
      render(
        <CheckoutSteps
          steps={STEPS.map((step) => ({ ...step, state: "current" }))}
        />,
      ),
    ).toThrow(RangeError);
  });

  it("has no axe violations", async () => {
    const { container } = render(<CheckoutSteps steps={STEPS} />);
    await expectNoAxeViolations(container);
  });
});
