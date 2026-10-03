import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { SortSelect, type SortSelectProps } from "./sort-select";

const PROPS: SortSelectProps = {
  action: "/categorias/cargadores",
  name: "orden",
  options: [
    { value: "relevancia", label: "Relevancia" },
    { value: "precio-asc", label: "Precio: menor a mayor" },
    { value: "precio-desc", label: "Precio: mayor a menor" },
  ],
  value: "relevancia",
  hiddenFields: [
    { name: "marca", value: "anker" },
    { name: "marca", value: "ugreen" },
  ],
};

describe("SortSelect", () => {
  it("is a native GET form that keeps the current filters", () => {
    const { container } = render(<SortSelect {...PROPS} />);

    const form = container.querySelector("form");
    expect(form).toHaveAttribute("action", "/categorias/cargadores");
    expect(form).toHaveAttribute("method", "get");
    expect(
      [...(form?.querySelectorAll("input[type='hidden']") ?? [])].map(
        (input) => [input.getAttribute("name"), input.getAttribute("value")],
      ),
    ).toEqual([
      ["marca", "anker"],
      ["marca", "ugreen"],
    ]);
  });

  it("labels the select and selects the current sort", () => {
    render(<SortSelect {...PROPS} value="precio-desc" />);

    const select = screen.getByRole("combobox", { name: "Ordenar por" });
    expect(select).toHaveAttribute("name", "orden");
    expect(select).toHaveValue("precio-desc");
    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Relevancia", "Precio: menor a mayor", "Precio: mayor a menor"]);
  });

  it("applies the new sort as soon as it changes", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<SortSelect {...PROPS} onApply={onApply} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ordenar por" }),
      "precio-asc",
    );

    expect(onApply).toHaveBeenCalledTimes(1);
    const [[params]] = onApply.mock.calls as [[URLSearchParams]];
    expect(params.toString()).toBe("marca=anker&marca=ugreen&orden=precio-asc");
  });

  it("shows a submit button only when scripting is off", () => {
    render(<SortSelect {...PROPS} />);

    const submit = screen.getByRole("button", {
      name: "Ordenar",
      hidden: true,
    });
    expect(submit).toHaveAttribute("type", "submit");
    expect(submit).toHaveClass("hidden", "noscript:inline-flex");
  });

  it("has no axe violations", async () => {
    const { container } = render(<SortSelect {...PROPS} />);

    await expectNoAxeViolations(container);
  });
});
