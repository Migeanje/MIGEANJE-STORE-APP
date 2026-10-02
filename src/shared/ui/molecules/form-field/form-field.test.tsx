import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/shared/ui/atoms/input";
import { expectNoAxeViolations } from "@/test/a11y";
import { FormField } from "./form-field";

const HINT = "Te enviaremos la confirmación del pedido a este correo.";
const ERROR = "Ingresa un correo válido, por ejemplo nombre@correo.com.";

describe("FormField", () => {
  it("renders an Input named by its label by default", () => {
    render(<FormField label="Nombre completo" />);

    const input = screen.getByRole("textbox", { name: "Nombre completo" });
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "text");
  });

  it("generates a distinct id for each field", () => {
    render(
      <div>
        <FormField label="Nombre" />
        <FormField label="Apellidos" />
      </div>,
    );

    const first = screen.getByRole("textbox", { name: "Nombre" });
    const second = screen.getByRole("textbox", { name: "Apellidos" });
    expect(first.id).not.toBe("");
    expect(first.id).not.toBe(second.id);
  });

  it("uses controlId for the control and derives the hint and error ids", () => {
    render(
      <FormField
        controlId="email"
        label="Correo electrónico"
        hint={HINT}
        error={ERROR}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("aria-describedby", "email-hint email-error");
    expect(screen.getByText(HINT)).toHaveAttribute("id", "email-hint");
    expect(screen.getByText(ERROR)).toHaveAttribute("id", "email-error");
  });

  it("describes the control with its hint", () => {
    render(<FormField label="Correo electrónico" hint={HINT} />);

    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).toHaveAccessibleDescription(HINT);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks the control invalid and describes it with the hint and the error", () => {
    render(<FormField label="Correo electrónico" hint={HINT} error={ERROR} />);

    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).toBeInvalid();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(`${HINT} ${ERROR}`);
  });

  it("sets no aria-describedby or aria-invalid without a hint or an error", () => {
    render(<FormField label="Empresa" />);

    const input = screen.getByRole("textbox", { name: "Empresa" });
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it.each([
    ["an empty string", ""],
    ["false", false],
    ["an empty array", []],
  ])("treats %s as no error", (_label, error) => {
    render(<FormField label="Correo electrónico" hint={HINT} error={error} />);

    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input.getAttribute("aria-describedby")).toMatch(/-hint$/);
    expect(input).toHaveAccessibleDescription(HINT);
  });

  it("announces a required field in its name and its state", () => {
    render(<FormField label="Correo electrónico" required />);

    const input = screen.getByRole("textbox", {
      name: "Correo electrónico (obligatorio)",
    });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-required", "true");
  });

  it("passes the control props to a custom control through the render prop", () => {
    render(
      <FormField
        label="Referencia para el delivery"
        hint="Por ejemplo: portón negro, frente al parque."
        error="Escribe una referencia de hasta 120 caracteres."
        required
      >
        {(control) => <textarea {...control} rows={3} />}
      </FormField>,
    );

    const textarea = screen.getByRole("textbox", {
      name: "Referencia para el delivery (obligatorio)",
    });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toBeRequired();
    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription(
      "Por ejemplo: portón negro, frente al parque. Escribe una referencia de hasta 120 caracteres.",
    );
  });

  it("lets the render prop configure the default Input", () => {
    render(
      <FormField label="Correo electrónico">
        {(control) => <Input {...control} type="email" autoComplete="email" />}
      </FormField>,
    );

    const input = screen.getByRole("textbox", { name: "Correo electrónico" });
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
  });

  it("forwards native props to the wrapper and merges className", () => {
    const { container } = render(
      <FormField
        label="Celular"
        className="sm:col-span-2"
        data-field="phone"
      />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("data-field", "phone");
    expect(wrapper).toHaveClass("sm:col-span-2", "flex", "flex-col");
  });

  it("has no axe violations (plain, hint, error, required, custom control)", async () => {
    const { container } = render(
      <form>
        <FormField label="Empresa" />
        <FormField label="Celular" hint="9 dígitos, sin espacios." />
        <FormField
          label="Correo electrónico"
          hint={HINT}
          error={ERROR}
          required
        />
        <FormField label="Referencia" error="Escribe una referencia.">
          {(control) => <textarea {...control} rows={3} />}
        </FormField>
      </form>,
    );

    await expectNoAxeViolations(container);
  });
});
