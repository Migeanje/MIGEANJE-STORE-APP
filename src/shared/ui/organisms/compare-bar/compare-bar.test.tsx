import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CompareBar } from "./compare-bar";

const ITEMS = [
  { key: "prime-100w", name: "Prime Charger 100W" },
  { key: "nexode-65w", name: "Nexode Cargador 65W" },
];

describe("CompareBar", () => {
  it("is a region with the count and a link to the comparator", () => {
    render(
      <CompareBar
        items={ITEMS}
        categoryName="Cargadores"
        max={4}
        compareHref="/comparar?productos=prime-100w,nexode-65w"
        onClear={() => {}}
      />,
    );

    const region = screen.getByRole("region", { name: "Comparación" });
    expect(region).toHaveTextContent("2 de 4 para comparar · Cargadores");
    expect(screen.getByRole("link", { name: "Comparar (2)" })).toHaveAttribute(
      "href",
      "/comparar?productos=prime-100w,nexode-65w",
    );
  });

  it("asks for another product while only one is picked", () => {
    render(
      <CompareBar
        items={ITEMS.slice(0, 1)}
        max={4}
        compareHref={null}
        onClear={() => {}}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.getByText("Agrega otro producto para comparar"),
    ).toBeInTheDocument();
  });

  it("empties the tray", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <CompareBar items={ITEMS} max={4} compareHref="/c" onClear={onClear} />,
    );

    await user.click(screen.getByRole("button", { name: "Vaciar" }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  it("renders nothing for an empty tray", () => {
    const { container } = render(
      <CompareBar items={[]} max={4} compareHref={null} onClear={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <CompareBar
        items={ITEMS}
        categoryName="Cargadores"
        max={4}
        compareHref="/c"
        onClear={() => {}}
      />,
    );

    await expectNoAxeViolations(container);
  });
});
