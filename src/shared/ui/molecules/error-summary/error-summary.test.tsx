import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ErrorSummary } from "./error-summary";

const ITEMS = [
  { fieldId: "correo", message: "Escribe tu correo electrónico." },
  { fieldId: "telefono", message: "Escribe un celular de 9 dígitos." },
];

describe("ErrorSummary", () => {
  it("renders nothing without items or message", () => {
    const { container } = render(<ErrorSummary items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists each error as a link to its field under a heading", () => {
    render(<ErrorSummary items={ITEMS} />);

    const summary = screen.getByRole("region", { name: "Revisa estos datos" });
    expect(summary).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByRole("link", { name: "Escribe tu correo electrónico." }),
    ).toHaveAttribute("href", "#correo");
    expect(
      screen.getByRole("link", { name: "Escribe un celular de 9 dígitos." }),
    ).toHaveAttribute("href", "#telefono");
  });

  it("shows a message about the whole form, with or without items", () => {
    render(
      <ErrorSummary
        title="No pudimos procesar el pago"
        message="Tu banco rechazó la tarjeta."
        items={[]}
      />,
    );
    expect(
      screen.getByRole("region", { name: "No pudimos procesar el pago" }),
    ).toHaveTextContent("Tu banco rechazó la tarjeta.");
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("moves focus to the field when a link is followed", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ErrorSummary items={ITEMS} />
        <label htmlFor="correo">Correo</label>
        <input id="correo" />
        <label htmlFor="telefono">Teléfono</label>
        <input id="telefono" />
      </>,
    );

    await user.click(
      screen.getByRole("link", { name: "Escribe un celular de 9 dígitos." }),
    );
    expect(screen.getByRole("textbox", { name: "Teléfono" })).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ErrorSummary message="Revisa tu tarjeta." items={ITEMS} />,
    );
    await expectNoAxeViolations(container);
  });
});
