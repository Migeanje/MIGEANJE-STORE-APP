import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SAMPLE_COMPARED, SAMPLE_ROWS } from "./__fixtures__/comparison";
import { ComparisonTable } from "./comparison-table";

const CAPTION = "Comparación de 3 cargadores";

function renderTable(rows = SAMPLE_ROWS) {
  return render(
    <ComparisonTable
      caption={CAPTION}
      products={SAMPLE_COMPARED}
      rows={rows}
    />,
  );
}

describe("ComparisonTable", () => {
  it("scrolls inside a keyboard-focusable region named by the caption", () => {
    renderTable();

    const region = screen.getByRole("region", { name: CAPTION });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(
      within(region).getByRole("table", { name: CAPTION }),
    ).toBeInTheDocument();
  });

  it("heads each column with the product name linking to its page", () => {
    renderTable();

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    expect(
      within(headers[2] as HTMLElement).getByRole("link", {
        name: "Nexode Cargador 65W",
      }),
    ).toHaveAttribute("href", "/productos/nexode-65w");
    expect(headers[2]).toHaveTextContent("UGREEN");
  });

  it("compares price, availability and every spec row by label", () => {
    renderTable();

    expect(
      screen.getAllByRole("rowheader").map((header) => header.textContent),
    ).toEqual([
      "Precio",
      "Disponibilidad",
      "Potencia máxima (valores distintos)",
      "Puertos USB-C (valores distintos)",
      "Protocolos de carga (valores distintos)",
      "Tecnología",
      "Quitar de la comparación",
    ]);
    const power = screen.getByRole("row", { name: /Potencia máxima/ });
    expect(
      within(power)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["100 W", "160 W", "65 W"]);
    expect(screen.getByRole("row", { name: /^Precio/ })).toHaveTextContent(
      /Precio actual/,
    );
  });

  it("says when a product lacks a spec", () => {
    renderTable();

    const protocols = screen.getByRole("row", { name: /Protocolos/ });
    expect(
      within(protocols)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["—Sin dato", "USB PD 3.1", "—Sin dato"]);
  });

  it("links to remove each product", () => {
    renderTable();

    expect(
      screen.getByRole("link", { name: "Quitar Nexode Cargador 65W" }),
    ).toHaveAttribute("href", "/comparar?productos=otro");
  });

  it("explains the difference marker only when a row differs", () => {
    const { rerender } = renderTable();
    expect(
      screen.getByText("Valores distintos entre los productos"),
    ).toBeInTheDocument();

    rerender(
      <ComparisonTable
        caption={CAPTION}
        products={SAMPLE_COMPARED}
        rows={SAMPLE_ROWS.filter((row) => !row.differs)}
      />,
    );
    expect(
      screen.queryByText("Valores distintos entre los productos"),
    ).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = renderTable();

    await expectNoAxeViolations(container);
  });
});
