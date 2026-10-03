import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { UbigeoFields } from "./ubigeo-fields";

const DEPARTAMENTOS = [
  { code: "04", name: "Arequipa" },
  { code: "15", name: "Lima" },
];
const PROVINCIAS = [
  { code: "1501", name: "Lima" },
  { code: "1505", name: "Cañete" },
];
const DISTRITOS = [
  { code: "150104", name: "Barranco" },
  { code: "150122", name: "Miraflores" },
];

function optionNames(select: HTMLElement) {
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent);
}

describe("UbigeoFields", () => {
  it("groups three labelled selects under a legend", () => {
    render(
      <UbigeoFields
        idPrefix="envio"
        departamentos={DEPARTAMENTOS}
        provincias={PROVINCIAS}
        distritos={DISTRITOS}
      />,
    );

    const group = screen.getByRole("group", { name: "Ubicación" });
    expect(
      within(group).getByRole("combobox", {
        name: "Departamento (obligatorio)",
      }),
    ).toHaveAttribute("id", "envio-departamento");
    expect(
      within(group).getByRole("combobox", { name: "Provincia (obligatorio)" }),
    ).toHaveAttribute("name", "provincia");
    expect(
      within(group).getByRole("combobox", { name: "Distrito (obligatorio)" }),
    ).toBeRequired();
  });

  it("offers a placeholder plus the options, with codes as values", () => {
    render(
      <UbigeoFields
        idPrefix="envio"
        departamentos={DEPARTAMENTOS}
        provincias={PROVINCIAS}
        distritos={DISTRITOS}
        defaultValues={{ departamento: "15", provincia: "1501", distrito: "" }}
      />,
    );

    const departamento = screen.getByRole("combobox", { name: /Departamento/ });
    expect(optionNames(departamento)).toEqual([
      "Elige un departamento",
      "Arequipa",
      "Lima",
    ]);
    expect(departamento).toHaveValue("15");
    expect(screen.getByRole("combobox", { name: /Distrito/ })).toHaveValue("");
  });

  it("asks to pick the parent first when a level has no options", () => {
    render(
      <UbigeoFields
        idPrefix="envio"
        departamentos={DEPARTAMENTOS}
        provincias={[]}
        distritos={[]}
      />,
    );
    expect(
      optionNames(screen.getByRole("combobox", { name: /Provincia/ })),
    ).toEqual(["Primero elige un departamento"]);
    expect(
      optionNames(screen.getByRole("combobox", { name: /Distrito/ })),
    ).toEqual(["Primero elige una provincia"]);
  });

  it("shows errors and passes extra props to each select", () => {
    render(
      <UbigeoFields
        idPrefix="envio"
        departamentos={DEPARTAMENTOS}
        provincias={PROVINCIAS}
        distritos={DISTRITOS}
        errors={{ distrito: "Elige tu distrito." }}
        selectProps={{ distrito: { "data-testid": "distrito" } as never }}
      />,
    );

    const distrito = screen.getByRole("combobox", { name: /Distrito/ });
    expect(distrito).toBeInvalid();
    expect(distrito).toHaveAccessibleDescription("Elige tu distrito.");
    expect(distrito).toHaveAttribute("data-testid", "distrito");
  });

  it("renders the no-JavaScript refresh control it receives", () => {
    render(
      <UbigeoFields
        idPrefix="envio"
        departamentos={DEPARTAMENTOS}
        provincias={PROVINCIAS}
        distritos={DISTRITOS}
        refreshControl={<button type="submit">Actualizar</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Actualizar" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations, with and without errors", async () => {
    const { container } = render(
      <form>
        <UbigeoFields
          idPrefix="a"
          departamentos={DEPARTAMENTOS}
          provincias={PROVINCIAS}
          distritos={DISTRITOS}
        />
        <UbigeoFields
          idPrefix="b"
          legend="Ubicación con errores"
          departamentos={DEPARTAMENTOS}
          provincias={[]}
          distritos={[]}
          errors={{
            departamento: "Elige tu departamento.",
            provincia: "Elige tu provincia.",
          }}
        />
      </form>,
    );
    await expectNoAxeViolations(container);
  });
});
