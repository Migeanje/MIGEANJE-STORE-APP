import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ComplaintBook, type ComplaintBookProps } from "./complaint-book";

const PROPS: ComplaintBookProps = {
  notice:
    "Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, Migeanje Store cuenta con un Libro de Reclamaciones virtual a tu disposición.",
  intro: "Completa esta Hoja de Reclamación para registrar tu reclamo o queja.",
  provider: [
    { term: "Nombre comercial", details: "Migeanje Store" },
    { term: "RUC", details: "Por definir" },
  ],
  legalNotes: [
    "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
    "El proveedor debe dar respuesta al reclamo o queja en un plazo no mayor a quince (15) días hábiles, el cual es improrrogable.",
  ],
  form: <form aria-label="Hoja de Reclamación" />,
};

describe("ComplaintBook", () => {
  it("titles the page and shows the legal notice", () => {
    render(<ComplaintBook {...PROPS} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Libro de Reclamaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText(PROPS.notice)).toBeInTheDocument();
    expect(screen.getByText(PROPS.intro)).toBeInTheDocument();
  });

  it("identifies the sheet and the provider before the form", () => {
    render(<ComplaintBook {...PROPS} />);

    const sheet = screen.getByRole("region", { name: "Hoja de Reclamación" });
    expect(sheet).toHaveTextContent("Se asigna al enviar");
    expect(sheet).toHaveTextContent("Se registra al enviar");
    expect(sheet).toHaveTextContent("Migeanje Store");
    expect(sheet).toHaveTextContent("Por definir");
    const notes = within(sheet).getAllByRole("listitem");
    expect(notes.map((note) => note.textContent)).toEqual(PROPS.legalNotes);
    expect(
      sheet.compareDocumentPosition(
        screen.getByRole("form", { name: "Hoja de Reclamación" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the demo note only when given", () => {
    const { rerender } = render(<ComplaintBook {...PROPS} />);
    expect(screen.queryByText(/Modo demostración/)).toBeNull();

    rerender(
      <ComplaintBook {...PROPS} demoNote="Modo demostración: sin correos." />,
    );
    expect(screen.getByText(/Modo demostración/)).toBeInTheDocument();
  });

  it("has no axe violations (with and without demo note)", async () => {
    const { container, rerender } = render(<ComplaintBook {...PROPS} />);
    await expectNoAxeViolations(container);

    rerender(<ComplaintBook {...PROPS} demoNote="Modo demostración." />);
    await expectNoAxeViolations(container);
  });
});
