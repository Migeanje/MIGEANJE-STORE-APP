import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { FieldError } from "../field-error";
import { Label } from "../label";
import { Input } from "./input";

describe("Input", () => {
  it("renders a native text input", () => {
    render(<Input aria-label="Nombre completo" />);

    const input = screen.getByRole("textbox", { name: "Nombre completo" });
    expect(input.tagName).toBe("INPUT");
  });

  it.each([
    ["email", "textbox"],
    ["tel", "textbox"],
    ["search", "searchbox"],
  ] as const)("supports type=%s", (type, role) => {
    render(<Input type={type} aria-label="Campo" />);

    expect(screen.getByRole(role, { name: "Campo" })).toHaveAttribute(
      "type",
      type,
    );
  });

  it("is 44px tall, rounded-md, on card, with the input border and focus ring", () => {
    render(<Input aria-label="Correo electrónico" />);

    expect(
      screen.getByRole("textbox", { name: "Correo electrónico" }),
    ).toHaveClass(
      "h-11",
      "rounded-md",
      "bg-card",
      "border-input",
      "focus-visible:outline-ring",
    );
  });

  it("switches to the destructive border when aria-invalid is true", () => {
    render(<Input aria-label="Correo electrónico" aria-invalid="true" />);
    const input = screen.getByRole("textbox", { name: "Correo electrónico" });

    expect(input).toBeInvalid();
    expect(input).toHaveClass("aria-invalid:border-destructive");
  });

  it("forwards native props, events and the ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(
      <Input
        ref={ref}
        aria-label="Teléfono"
        type="tel"
        name="phone"
        autoComplete="tel"
        placeholder="987 654 321"
        required
        onChange={onChange}
        className="max-w-xs"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Teléfono" });

    fireEvent.change(input, { target: { value: "987654321" } });

    expect(ref.current).toBe(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(input).toHaveValue("987654321");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("name", "phone");
    expect(input).toHaveAttribute("autocomplete", "tel");
    expect(input).toHaveAttribute("placeholder", "987 654 321");
    expect(input).toHaveClass("max-w-xs", "w-full");
  });

  it("can be disabled", () => {
    render(<Input aria-label="Código de descuento" disabled />);

    expect(
      screen.getByRole("textbox", { name: "Código de descuento" }),
    ).toBeDisabled();
  });

  it("composes with Label and FieldError", () => {
    render(
      <div>
        <Label htmlFor="email" required>
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          required
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <FieldError id="email-error">
          Ingresa un correo válido, por ejemplo nombre@correo.com.
        </FieldError>
      </div>,
    );

    const input = screen.getByRole("textbox", {
      name: "Correo electrónico (obligatorio)",
    });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      "Ingresa un correo válido, por ejemplo nombre@correo.com.",
    );
  });

  it("has no axe violations (default, invalid, disabled, composed)", async () => {
    const { container } = render(
      <div>
        <Input aria-label="Nombre completo" />
        <Input aria-label="Buscar productos" type="search" />
        <Input aria-label="Código de descuento" disabled />
        <Label htmlFor="email" required>
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          required
          aria-invalid="true"
          aria-describedby="email-error"
        />
        <FieldError id="email-error">Ingresa un correo válido.</FieldError>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
