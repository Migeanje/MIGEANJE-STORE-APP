import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ComplaintBookContainer } from "./complaint-book.container";

vi.mock("server-only", () => ({}));
vi.mock("./actions", () => ({ fileComplaintAction: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ComplaintBookContainer", () => {
  it("shows the aviso, the provider (por definir) and the legal notes", async () => {
    render(await ComplaintBookContainer({}));

    expect(
      screen.getByRole("heading", { level: 1, name: "Libro de Reclamaciones" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Código de Protección y Defensa del Consumidor/),
    ).toBeInTheDocument();
    const sheet = screen.getByRole("region", { name: "Hoja de Reclamación" });
    expect(sheet).toHaveTextContent("Migeanje Store");
    expect(within(sheet).getAllByText("Por definir")).toHaveLength(3);
    expect(sheet).toHaveTextContent(
      "plazo no mayor a quince (15) días hábiles, el cual es improrrogable",
    );
    expect(sheet).toHaveTextContent(
      "no impide acudir a otras vías de solución de controversias",
    );
  });

  it("offers the form with the ubigeo of the data source", async () => {
    render(await ComplaintBookContainer({}));

    const form = screen.getByRole("form", { name: "Hoja de Reclamación" });
    const departamentos = within(form).getByRole("combobox", {
      name: /Departamento/,
    });
    // The mock directory lists all 25 departamentos (plus the placeholder).
    expect(within(departamentos).getAllByRole("option")).toHaveLength(26);
  });

  it("prefills a well-formed order number from ?pedido= only", async () => {
    const { unmount } = render(
      await ComplaintBookContainer({ pedido: "mg 2026 480315" }),
    );
    expect(
      screen.getByRole("textbox", { name: /Número de pedido/ }),
    ).toHaveValue("MG-2026-480315");
    unmount();

    render(await ComplaintBookContainer({ pedido: "javascript:alert(1)" }));
    expect(
      screen.getByRole("textbox", { name: /Número de pedido/ }),
    ).toHaveValue("");
  });

  it("says no real email is sent with mock data only", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    render(await ComplaintBookContainer({}));

    expect(screen.getByText(/Modo demostración/)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(await ComplaintBookContainer({}));

    await expectNoAxeViolations(container);
  });
});
