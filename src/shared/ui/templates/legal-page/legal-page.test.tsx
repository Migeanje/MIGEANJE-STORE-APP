import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  LegalPage,
  type LegalPageProps,
  type LegalSection,
} from "./legal-page";

const PROPS: LegalPageProps = {
  title: "Términos y condiciones",
  intro: "Las reglas de compra en Migeanje Store.",
  updatedAt: { label: "3 de octubre de 2026", dateTime: "2026-10-03" },
  sections: [
    {
      id: "quienes-somos",
      title: "Quiénes somos",
      content: <p>Migeanje Store vende accesorios de tecnología.</p>,
    },
    {
      id: "precios",
      title: "Precios",
      content: (
        <ul>
          <li>En soles</li>
          <li>Incluyen impuestos</li>
        </ul>
      ),
    },
    {
      id: "reclamos",
      title: "Reclamos",
      content: (
        <p>
          Usa el <a href="/libro-de-reclamaciones">Libro de Reclamaciones</a>.
        </p>
      ),
    },
  ],
};

describe("LegalPage", () => {
  it("titles the page and says when it was last updated", () => {
    render(<LegalPage {...PROPS} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Términos y condiciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Las reglas de compra en Migeanje Store."),
    ).toBeInTheDocument();
    const date = screen.getByText("3 de octubre de 2026");
    expect(date.tagName).toBe("TIME");
    expect(date).toHaveAttribute("dateTime", "2026-10-03");
    expect(date.parentElement).toHaveTextContent(
      "Última actualización: 3 de octubre de 2026",
    );
  });

  it("renders each section as a region with an anchor, listed in the table of contents", () => {
    render(<LegalPage {...PROPS} />);

    const toc = screen.getByRole("navigation", { name: "En esta página" });
    const links = within(toc).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#quienes-somos",
      "#precios",
      "#reclamos",
    ]);
    for (const { id, title } of PROPS.sections) {
      const section = screen.getByRole("region", { name: title });
      expect(section).toHaveAttribute("id", id);
      expect(
        within(section).getByRole("heading", { level: 2, name: title }),
      ).toBeInTheDocument();
    }
    expect(
      within(screen.getByRole("region", { name: "Reclamos" })).getByRole(
        "link",
        { name: "Libro de Reclamaciones" },
      ),
    ).toHaveAttribute("href", "/libro-de-reclamaciones");
  });

  it("leaves out the table of contents for short pages unless asked", () => {
    const short = { ...PROPS, sections: PROPS.sections.slice(0, 2) };
    const { rerender } = render(<LegalPage {...short} />);
    expect(
      screen.queryByRole("navigation", { name: "En esta página" }),
    ).toBeNull();

    rerender(<LegalPage {...short} toc />);
    expect(
      screen.getByRole("navigation", { name: "En esta página" }),
    ).toBeInTheDocument();

    rerender(<LegalPage {...PROPS} toc={false} />);
    expect(
      screen.queryByRole("navigation", { name: "En esta página" }),
    ).toBeNull();
  });

  it("shows the draft banner only for a draft", () => {
    const { rerender } = render(<LegalPage {...PROPS} />);
    expect(
      screen.queryByText(/Borrador pendiente de revisión legal/),
    ).toBeNull();

    rerender(
      <LegalPage {...PROPS} draftNote="Un abogado debe revisar este texto." />,
    );
    expect(
      screen.getByText(/Borrador pendiente de revisión legal/).parentElement,
    ).toHaveTextContent(
      "Borrador pendiente de revisión legal. Un abogado debe revisar este texto.",
    );
  });

  it("lists related pages after the sections", () => {
    render(
      <LegalPage
        {...PROPS}
        related={[
          { href: "/privacidad", label: "Privacidad" },
          { href: "/garantias", label: "Garantías" },
        ]}
      />,
    );
    const related = screen.getByRole("navigation", {
      name: "También te puede servir",
    });
    expect(
      within(related).getByRole("link", { name: "Privacidad" }),
    ).toHaveAttribute("href", "/privacidad");
    expect(
      screen
        .getByRole("region", { name: "Reclamos" })
        .compareDocumentPosition(related) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("throws a RangeError for anchors or dates that would break the page", () => {
    const section: LegalSection = {
      id: "precios",
      title: "Precios",
      content: <p>En soles.</p>,
    };
    expect(() =>
      render(<LegalPage {...PROPS} sections={[section, section]} />),
    ).toThrow(RangeError);
    expect(() =>
      render(
        <LegalPage
          {...PROPS}
          sections={[{ ...section, id: "Con espacios" }]}
        />,
      ),
    ).toThrow(RangeError);
    expect(() =>
      render(
        <LegalPage
          {...PROPS}
          updatedAt={{ label: "hoy", dateTime: "03/10/2026" }}
        />,
      ),
    ).toThrow(RangeError);
  });

  it("has no axe violations (with and without contents, banner and related links)", async () => {
    const { container, rerender } = render(<LegalPage {...PROPS} />);
    await expectNoAxeViolations(container);

    rerender(
      <LegalPage
        {...PROPS}
        draftNote="Un abogado debe revisar este texto."
        related={[{ href: "/privacidad", label: "Privacidad" }]}
      />,
    );
    await expectNoAxeViolations(container);

    rerender(<LegalPage {...PROPS} toc={false} />);
    await expectNoAxeViolations(container);
  });
});
