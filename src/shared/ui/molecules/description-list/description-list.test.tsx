import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { DescriptionList } from "./description-list";

const ITEMS = [
  { term: "RUC", details: "Por definir" },
  { term: "Domicilio", details: ["Av. Larco 1234", "Miraflores, Lima, Lima"] },
  { term: "Número de pedido", details: "MG-2026-000123", mono: true },
];

describe("DescriptionList", () => {
  it("pairs every term with its details", () => {
    render(<DescriptionList items={ITEMS} />);

    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    expect(terms).toEqual(["RUC", "Domicilio", "Número de pedido"]);
    const details = screen.getAllByRole("definition");
    expect(details[0]).toHaveTextContent("Por definir");
  });

  it("puts each line of multi-line details on its own line", () => {
    render(<DescriptionList items={ITEMS} />);

    const [, address] = screen.getAllByRole("definition");
    if (!address) throw new Error("expected the address");
    expect(
      Array.from(address.children).map((line) => line.textContent),
    ).toEqual(["Av. Larco 1234", "Miraflores, Lima, Lima"]);
  });

  it("shows data such as numbers in Geist Mono and keeps line breaks of long text", () => {
    render(
      <DescriptionList
        items={[
          ...ITEMS,
          { term: "Detalle", details: "Línea 1\nLínea 2", preformatted: true },
        ]}
      />,
    );

    const details = screen.getAllByRole("definition");
    expect(
      within(details[2] as HTMLElement).getByText("MG-2026-000123"),
    ).toHaveClass("font-mono");
    expect(details[3]).toHaveClass("whitespace-pre-line");
  });

  it("has no axe violations (one and two columns)", async () => {
    const { container } = render(
      <div>
        <DescriptionList items={ITEMS} />
        <DescriptionList items={ITEMS} columns={2} />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
