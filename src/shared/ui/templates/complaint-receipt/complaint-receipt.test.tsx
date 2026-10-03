import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  ComplaintReceipt,
  type ComplaintReceiptProps,
} from "./complaint-receipt";

const PROPS: ComplaintReceiptProps = {
  title: "Registramos tu reclamo",
  number: "000000001-2026",
  filedAt: {
    label: "3 oct. 2026, 10:00 a. m.",
    dateTime: "2026-10-03T15:00:00.000Z",
  },
  copy: {
    sent: true,
    text: "Te enviamos una copia de esta Hoja de Reclamación a ana@correo.pe.",
  },
  due: "Te responderemos por correo a más tardar el viernes 23 de octubre de 2026.",
  recipient: "Destinatario: consumidor (tu copia)",
  provider: [
    { term: "Nombre comercial", details: "Migeanje Store" },
    { term: "RUC", details: "Por definir" },
  ],
  sections: [
    {
      title: "1. Identificación del consumidor reclamante",
      items: [
        { term: "Nombre", details: "Ana Pérez Quispe" },
        { term: "Documento", details: "DNI 46027897", mono: true },
      ],
    },
    {
      title: "2. Identificación del bien contratado",
      items: [{ term: "Tipo", details: "Producto" }],
    },
    {
      title: "3. Detalle de la reclamación y pedido del consumidor",
      items: [
        { term: "Tipo", details: "Reclamo" },
        {
          term: "Detalle",
          details: "Dejó de funcionar.",
          preformatted: true,
        },
      ],
    },
    {
      title: "4. Observaciones y acciones adoptadas por el proveedor",
      items: [
        { term: "Respuesta", details: "Pendiente." },
        { term: "Fecha de comunicación de la respuesta", details: "Pendiente" },
      ],
    },
  ],
  legalNotes: [
    "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.",
  ],
  homeHref: "/",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ComplaintReceipt", () => {
  it("confirms the filing with the sheet number in mono and its date", () => {
    render(<ComplaintReceipt {...PROPS} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Registramos tu reclamo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("000000001-2026")).toHaveClass("font-mono");
    const time = screen.getByText("3 oct. 2026, 10:00 a. m.");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-10-03T15:00:00.000Z");
  });

  it("says where the copy went and when the answer is due", () => {
    render(<ComplaintReceipt {...PROPS} />);

    expect(screen.getByText(PROPS.copy.text)).toBeInTheDocument();
    expect(screen.getByText(PROPS.due)).toBeInTheDocument();
    expect(screen.getByText(PROPS.recipient)).toBeInTheDocument();
  });

  it("announces a copy that could not be sent", () => {
    render(
      <ComplaintReceipt
        {...PROPS}
        copy={{ sent: false, text: "No pudimos enviarte la copia." }}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "No pudimos enviarte la copia.",
    );
  });

  it("shows the provider and every section of the sheet", () => {
    render(<ComplaintReceipt {...PROPS} />);

    expect(
      screen.getByRole("region", { name: "Datos del proveedor" }),
    ).toHaveTextContent("Migeanje Store");
    for (const section of PROPS.sections) {
      const region = screen.getByRole("region", { name: section.title });
      for (const item of section.items) {
        expect(within(region).getByText(item.term)).toBeInTheDocument();
      }
    }
    expect(screen.getByText(PROPS.legalNotes[0] as string)).toBeInTheDocument();
  });

  it("prints from a button that stays off paper, and links back to the store", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<ComplaintReceipt {...PROPS} />);

    await user.click(
      screen.getByRole("button", { name: "Imprimir o guardar como PDF" }),
    );

    expect(print).toHaveBeenCalledOnce();
    const back = screen.getByRole("link", { name: "Volver a la tienda" });
    expect(back).toHaveAttribute("href", "/");
    expect(back.closest(".print\\:hidden")).not.toBeNull();
  });

  it("has no axe violations (copy sent and copy failed)", async () => {
    const { container, rerender } = render(<ComplaintReceipt {...PROPS} />);
    await expectNoAxeViolations(container);

    rerender(
      <ComplaintReceipt
        {...PROPS}
        copy={{ sent: false, text: "No pudimos enviarte la copia." }}
      />,
    );
    await expectNoAxeViolations(container);
  });
});
