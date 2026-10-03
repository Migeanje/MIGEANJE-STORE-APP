import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { CHARGER_FILTERS } from "./__fixtures__/groups";
import {
  FilterPanel,
  type FilterPanelProps,
  FilterSheet,
} from "./filter-panel";

const PROPS: FilterPanelProps = {
  action: "/categorias/cargadores",
  groups: CHARGER_FILTERS,
  hiddenFields: [{ name: "orden", value: "precio-asc" }],
  activeCount: 2,
  clearHref: "/categorias/cargadores?orden=precio-asc",
};

function getForm(): HTMLFormElement {
  return screen.getByRole("form", { name: "Filtros" }) as HTMLFormElement;
}

describe("FilterPanel", () => {
  it("is a native GET form to the listing, so it works without JavaScript", () => {
    render(<FilterPanel {...PROPS} />);

    const form = getForm();
    expect(form).toHaveAttribute("action", "/categorias/cargadores");
    expect(form).toHaveAttribute("method", "get");
    expect(form.elements.namedItem("orden")).toHaveValue("precio-asc");
  });

  it("groups checkboxes under a legend and names them with their count", () => {
    render(<FilterPanel {...PROPS} />);

    const brand = screen.getByRole("group", { name: "Marca" });
    expect(
      within(brand).getByRole("checkbox", { name: "Anker, 3 productos" }),
    ).toBeChecked();
    expect(
      within(brand).getByRole("checkbox", { name: "UGREEN, 1 producto" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Pantalla, 2 productos" }),
    ).toHaveAttribute("name", "pantalla");
  });

  it("offers a range as two number fields with the available bounds as a hint", () => {
    render(<FilterPanel {...PROPS} />);

    const range = screen.getByRole("group", { name: "Potencia máxima (W)" });
    const from = within(range).getByRole("spinbutton", { name: "Desde" });
    const to = within(range).getByRole("spinbutton", { name: "Hasta" });
    expect(from).toHaveAttribute("name", "potencia-desde");
    expect(from).toHaveValue(null);
    expect(to).toHaveValue(100);
    expect(from).toHaveAccessibleDescription("Entre 45 y 160 W");
  });

  it("submits natively when there is no client navigation", () => {
    render(<FilterPanel {...PROPS} />);

    // fireEvent returns false when a handler called preventDefault().
    expect(fireEvent.submit(getForm())).toBe(true);
  });

  it("hands the filled fields to onApply instead of reloading the page", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterPanel {...PROPS} onApply={onApply} />);

    await user.click(
      screen.getByRole("checkbox", { name: "UGREEN, 1 producto" }),
    );
    await user.type(screen.getByRole("spinbutton", { name: "Desde" }), "60");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(onApply).toHaveBeenCalledTimes(1);
    const params = onApply.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.toString()).toBe(
      "orden=precio-asc&marca=anker&marca=ugreen&potencia-desde=60&potencia-hasta=100&pantalla=si",
    );
  });

  it("links to clear the filters only when some are active", () => {
    const { rerender } = render(<FilterPanel {...PROPS} />);
    expect(
      screen.getByRole("link", { name: "Quitar filtros" }),
    ).toHaveAttribute("href", "/categorias/cargadores?orden=precio-asc");

    rerender(<FilterPanel {...PROPS} activeCount={0} />);
    expect(screen.queryByRole("link", { name: "Quitar filtros" })).toBeNull();
  });

  it("is the no-JavaScript target of the mobile filters link", () => {
    render(<FilterPanel {...PROPS} />);

    const panel = screen.getByRole("region", { name: "Filtros" });
    expect(panel).toHaveAttribute("id", "filtros");
    // Hidden on phones until targeted by #filtros; always shown from lg.
    expect(panel).toHaveClass("hidden", "target:flex", "lg:flex");
  });

  it("has no axe violations", async () => {
    const { container } = render(<FilterPanel {...PROPS} />);

    await expectNoAxeViolations(container);
  });
});

describe("FilterSheet", () => {
  it("opens the filters in a sheet from a button that shows the active count", async () => {
    const user = userEvent.setup();
    render(<FilterSheet {...PROPS} />);

    await user.click(
      screen.getByRole("button", { name: "Filtros, 2 activos" }),
    );

    const sheet = screen.getByRole("dialog", { name: "Filtros" });
    expect(within(sheet).getByRole("group", { name: "Marca" })).toBeVisible();
  });

  it("names the button without a count when nothing is active", () => {
    render(<FilterSheet {...PROPS} activeCount={0} />);

    expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
  });

  it("closes the sheet and applies the filters", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterSheet {...PROPS} onApply={onApply} />);

    await user.click(
      screen.getByRole("button", { name: "Filtros, 2 activos" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Aplicar filtros",
      }),
    );

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("falls back to a link to the inline panel without JavaScript", () => {
    const { container } = render(<FilterSheet {...PROPS} />);

    const fallback = container.querySelector("a[href='#filtros']");
    expect(fallback).toHaveTextContent("Filtros");
    // Only shown when scripting is off (@media (scripting: none)).
    expect(fallback).toHaveClass("hidden", "noscript:inline-flex");
    expect(
      screen.getByRole("button", { name: "Filtros, 2 activos" }),
    ).toHaveClass("noscript:hidden");
  });

  it("has no axe violations closed and open", async () => {
    const user = userEvent.setup();
    render(<FilterSheet {...PROPS} />);
    await expectNoAxeViolations(document.body);

    await user.click(
      screen.getByRole("button", { name: "Filtros, 2 activos" }),
    );
    await expectNoAxeViolations(document.body);
  });
});
