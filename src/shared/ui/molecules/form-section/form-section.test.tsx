import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/shared/ui/atoms/input";
import { expectNoAxeViolations } from "@/test/a11y";
import { FormSection } from "./form-section";

describe("FormSection", () => {
  it("is a region named by its heading, with the fields inside", () => {
    render(
      <FormSection title="1. Identificación del consumidor reclamante">
        <Input aria-label="Nombres" />
      </FormSection>,
    );

    const section = screen.getByRole("region", {
      name: "1. Identificación del consumidor reclamante",
    });
    expect(
      within(section).getByRole("heading", { level: 2 }),
    ).toHaveTextContent("1. Identificación del consumidor reclamante");
    expect(
      within(section).getByRole("textbox", { name: "Nombres" }),
    ).toBeInTheDocument();
  });

  it("describes the section and accepts another heading level", () => {
    render(
      <FormSection
        title="2. Identificación del bien contratado"
        headingLevel={3}
        description="Si no compraste en la tienda, deja vacío el número de pedido."
      >
        <Input aria-label="Descripción" />
      </FormSection>,
    );

    const section = screen.getByRole("region", {
      name: "2. Identificación del bien contratado",
    });
    expect(section).toHaveAccessibleDescription(
      "Si no compraste en la tienda, deja vacío el número de pedido.",
    );
    expect(
      within(section).getByRole("heading", { level: 3 }),
    ).toBeInTheDocument();
  });

  it("has no axe violations (with and without description)", async () => {
    const { container } = render(
      <div>
        <FormSection title="Datos">
          <Input aria-label="Nombres" />
        </FormSection>
        <FormSection title="Bien" description="Opcional.">
          <Input aria-label="Descripción" />
        </FormSection>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
