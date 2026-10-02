import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Label } from "./label";

describe("Label", () => {
  it("renders a native label that names its field", () => {
    render(
      <div>
        <Label htmlFor="name">Nombre completo</Label>
        <input id="name" />
      </div>,
    );

    const label = screen.getByText("Nombre completo");
    expect(label.tagName).toBe("LABEL");
    expect(screen.getByLabelText("Nombre completo")).toHaveAttribute(
      "id",
      "name",
    );
  });

  it("uses the body-sm type token", () => {
    render(<Label>Nombre completo</Label>);

    expect(screen.getByText("Nombre completo")).toHaveClass("text-body-sm");
  });

  it("announces the required marker as text, not only as an asterisk", () => {
    render(
      <div>
        <Label htmlFor="email" required>
          Correo electrónico
        </Label>
        <input id="email" required />
      </div>,
    );

    expect(
      screen.getByRole("textbox", { name: "Correo electrónico (obligatorio)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("(obligatorio)")).toHaveClass("sr-only");
    // The visible asterisk is decorative.
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("shows no required marker by default", () => {
    render(<Label>Empresa</Label>);

    const label = screen.getByText("Empresa");
    expect(label.textContent).toBe("Empresa");
  });

  it("forwards native props and merges className", () => {
    render(
      <Label id="label-ruc" className="text-caption">
        RUC
      </Label>,
    );
    const label = screen.getByText("RUC");

    expect(label).toHaveAttribute("id", "label-ruc");
    expect(label).toHaveClass("text-caption");
    expect(label).not.toHaveClass("text-body-sm");
  });

  it("has no axe violations (optional and required)", async () => {
    const { container } = render(
      <div>
        <Label htmlFor="company">Empresa</Label>
        <input id="company" />
        <Label htmlFor="email" required>
          Correo electrónico
        </Label>
        <input id="email" type="email" required />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
