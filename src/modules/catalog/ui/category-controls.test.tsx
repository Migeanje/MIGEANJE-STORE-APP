import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CHARGERS } from "@/modules/catalog/testing/catalog-builders";
import { CategoryFilters, CategorySort } from "./category-controls";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

const GROUPS = [
  {
    kind: "checkboxes" as const,
    legend: "Marca",
    options: [
      {
        name: "marca",
        value: "ugreen",
        label: "UGREEN",
        count: 2,
        checked: false,
      },
      {
        name: "marca",
        value: "anker",
        label: "Anker",
        count: 2,
        checked: false,
      },
    ],
  },
  {
    kind: "range" as const,
    legend: "Potencia máxima",
    unit: "W",
    min: 20,
    max: 100,
    from: { name: "potencia-desde" },
    to: { name: "potencia-hasta" },
  },
];

describe("CategoryFilters", () => {
  beforeEach(() => {
    navigation.push.mockClear();
  });

  it("navigates on the client to the canonical URL of the chosen filters", async () => {
    const user = userEvent.setup();
    render(
      <CategoryFilters
        variant="panel"
        category={CHARGERS}
        groups={GROUPS}
        hiddenFields={[{ name: "orden", value: "precio-asc" }]}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: "UGREEN, 2 productos" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Anker, 2 productos" }),
    );
    await user.type(screen.getByRole("spinbutton", { name: "Hasta" }), "140");
    await user.type(screen.getByRole("spinbutton", { name: "Desde" }), "60");
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(navigation.push).toHaveBeenCalledWith(
      "/categorias/cargadores?marca=anker&marca=ugreen&potencia=60-140&orden=precio-asc",
      { scroll: false },
    );
  });

  it("submits to the category page and offers the mobile sheet", () => {
    render(
      <CategoryFilters variant="sheet" category={CHARGERS} groups={GROUPS} />,
    );

    expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
  });
});

describe("CategorySort", () => {
  beforeEach(() => {
    navigation.push.mockClear();
  });

  it("navigates to the canonical URL with the new sort, back to page 1", async () => {
    const user = userEvent.setup();
    render(
      <CategorySort
        category={CHARGERS}
        name="orden"
        value="relevancia"
        options={[
          { value: "relevancia", label: "Relevancia" },
          { value: "precio-desc", label: "Precio: mayor a menor" },
        ]}
        hiddenFields={[{ name: "marca", value: "anker" }]}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Ordenar por" }),
      "precio-desc",
    );

    expect(navigation.push).toHaveBeenCalledWith(
      "/categorias/cargadores?marca=anker&orden=precio-desc",
      { scroll: false },
    );
  });
});
