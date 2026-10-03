import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CheckboxField } from "./checkbox-field";

describe("CheckboxField", () => {
  it("is a native checkbox named by its label", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CheckboxField
        id="principal"
        name="principal"
        value="si"
        label="Usar como dirección principal"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Usar como dirección principal",
    });
    expect(checkbox).toHaveAttribute("name", "principal");
    expect(checkbox).toHaveAttribute("value", "si");
    await user.click(screen.getByText("Usar como dirección principal"));
    expect(checkbox).toBeChecked();
    await expectNoAxeViolations(container);
  });

  it("describes the checkbox with its hint and error", async () => {
    const { container } = render(
      <CheckboxField
        id="terminos"
        label="Acepto los términos"
        hint="Puedes leerlos antes."
        error="Acepta los términos para continuar."
        required
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Acepto los términos",
    });
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAccessibleDescription(
      "Puedes leerlos antes. Acepta los términos para continuar.",
    );
    await expectNoAxeViolations(container);
  });

  it("is valid without an error", () => {
    render(<CheckboxField id="x" label="Recordarme" />);
    const checkbox = screen.getByRole("checkbox", { name: "Recordarme" });
    expect(checkbox).not.toHaveAttribute("aria-invalid");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
  });
});
