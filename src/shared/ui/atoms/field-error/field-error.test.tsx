import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { FieldError } from "./field-error";

const MESSAGE = "Ingresa un correo válido, por ejemplo nombre@correo.com.";

describe("FieldError", () => {
  it("renders the message with its id so a field can reference it", () => {
    render(<FieldError id="email-error">{MESSAGE}</FieldError>);

    const error = screen.getByText(MESSAGE);
    expect(error).toHaveAttribute("id", "email-error");
    expect(error).toHaveClass("text-destructive", "text-body-sm");
  });

  it("adds a decorative error icon; the text carries the meaning", () => {
    render(<FieldError id="email-error">{MESSAGE}</FieldError>);
    const error = screen.getByText(MESSAGE);

    const icon = error.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(error.textContent).toBe(MESSAGE);
  });

  it.each([
    ["no children", undefined],
    ["null", null],
    ["false", false],
    ["an empty string", ""],
  ])("renders nothing with %s", (_label, message) => {
    const { container } = render(
      <FieldError id="email-error">{message}</FieldError>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("forwards native props and merges className", () => {
    render(
      <FieldError id="phone-error" className="mt-2" data-field="phone">
        Ingresa un número de 9 dígitos.
      </FieldError>,
    );
    const error = screen.getByText("Ingresa un número de 9 dígitos.");

    expect(error).toHaveAttribute("data-field", "phone");
    expect(error).toHaveClass("mt-2", "text-destructive");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <FieldError id="email-error">{MESSAGE}</FieldError>,
    );

    await expectNoAxeViolations(container);
  });
});
