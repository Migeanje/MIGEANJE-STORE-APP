import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aUbigeoTree } from "@/modules/checkout/testing/checkout-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  type ComplaintFormState,
  complaintFormInitialState,
} from "./complaint-form";
import {
  ComplaintSheetForm,
  type FileComplaintAction,
} from "./complaint-sheet-form";

function renderForm({
  action = vi.fn<FileComplaintAction>(async (state) => state),
  initialState = complaintFormInitialState(),
}: {
  action?: FileComplaintAction;
  initialState?: ComplaintFormState;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <ComplaintSheetForm
      action={action}
      initialState={initialState}
      ubigeo={aUbigeoTree()}
      privacyHref="/privacidad"
    />,
  );
  return { user, action, ...view };
}

const field = (name: RegExp) => screen.getByRole("textbox", { name });

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field(/^Nombres/), "Ana");
  await user.type(field(/^Apellidos/), "Pérez Quispe");
  await user.type(field(/^Número de documento/), "46027897");
  await user.type(
    field(/^Correo electrónico \(obligatorio\)/),
    "ana@correo.pe",
  );
  await user.type(field(/^Domicilio \(obligatorio\)/), "Av. Larco 1234");
  await user.selectOptions(
    screen.getByRole("combobox", { name: /Departamento/ }),
    "15",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /Provincia/ }),
    "1501",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: /Distrito/ }),
    "150122",
  );
  await user.click(screen.getByRole("radio", { name: "Reclamo" }));
  await user.type(field(/^Detalle/), "Dejó de funcionar.");
  await user.click(
    screen.getByRole("checkbox", { name: /Declaro que los datos/ }),
  );
}

describe("ComplaintSheetForm", () => {
  it("follows the sections of the Hoja de Reclamación", () => {
    renderForm();

    const form = screen.getByRole("form", { name: "Hoja de Reclamación" });
    expect(
      within(form)
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual([
      "1. Identificación del consumidor reclamante",
      "2. Identificación del bien contratado",
      "3. Detalle de la reclamación y pedido del consumidor",
    ]);
  });

  it("defines reclamo and queja next to the choice", () => {
    renderForm();

    expect(
      screen.getByRole("radio", { name: "Reclamo" }),
    ).toHaveAccessibleDescription(
      "Disconformidad relacionada a los productos o servicios.",
    );
    expect(
      screen.getByRole("radio", { name: "Queja" }),
    ).toHaveAccessibleDescription(
      "Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.",
    );
    expect(screen.getByRole("radio", { name: "Reclamo" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Queja" })).not.toBeChecked();
  });

  it("starts with a DNI, a product and the answer by email", () => {
    renderForm();

    expect(
      screen.getByRole("combobox", { name: /Tipo de documento/ }),
    ).toHaveValue("dni");
    expect(screen.getByRole("radio", { name: "Producto" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Por correo electrónico" }),
    ).toBeChecked();
  });

  it("prefills the order number from the link", () => {
    renderForm({ initialState: complaintFormInitialState("mg-2026-000123") });

    expect(field(/^Número de pedido/)).toHaveValue("MG-2026-000123");
  });

  it("marks only the legally required fields as required", () => {
    renderForm();

    for (const name of [
      /^Nombres/,
      /^Apellidos/,
      /^Número de documento/,
      /^Correo electrónico \(obligatorio\)/,
      /^Domicilio \(obligatorio\)/,
      /^Detalle/,
    ]) {
      expect(field(name)).toBeRequired();
    }
    for (const id of [
      "hoja-phone",
      "hoja-orderNumber",
      "hoja-amount",
      "hoja-goodDescription",
      "hoja-request",
    ]) {
      expect(document.getElementById(id)).not.toBeRequired();
    }
  });

  it("asks for a parent or representative inside the minor's group", () => {
    renderForm();

    const minor = screen.getByRole("checkbox", { name: "Soy menor de edad" });
    const guardian = screen.getByRole("group", {
      name: "Madre, padre o representante",
    });
    // Shown with CSS while the box is checked (no JavaScript needed).
    expect(guardian).toHaveClass(
      "hidden",
      "group-has-[#hoja-isMinor:checked]:flex",
    );
    expect(minor).toHaveAttribute("id", "hoja-isMinor");
    expect(
      within(guardian).getByRole("textbox", { name: /Nombre completo/ }),
    ).toBeInTheDocument();
  });

  it("checks the fields on the client and focuses the error summary", async () => {
    const { user, action } = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Enviar Hoja de Reclamación" }),
    );

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", {
        name: "Elige si es un reclamo o una queja.",
      }),
    ).toHaveAttribute("href", "#hoja-kind-reclamo");
    expect(
      within(summary).getByRole("link", { name: "Cuéntanos qué pasó." }),
    ).toHaveAttribute("href", "#hoja-detail");
    expect(action).not.toHaveBeenCalled();
  });

  it("posts the typed values once the required fields are filled", async () => {
    const { user, action } = renderForm();

    await fillRequired(user);
    await user.click(
      screen.getByRole("button", { name: "Enviar Hoja de Reclamación" }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(data.get("kind")).toBe("reclamo");
    expect(data.get("distrito")).toBe("150122");
    expect(data.get("acceptDeclaration")).toBe("si");
    expect(data.get("isMinor")).toBeNull();
  });

  it("shows the server's errors and a form error", async () => {
    renderForm({
      initialState: {
        values: { detail: "Dejó de funcionar.", documentType: "dni" },
        errors: { distrito: "No encontramos ese distrito." },
        formError: {
          title: "No pudimos registrar tu Hoja de Reclamación",
          message: "Inténtalo de nuevo.",
        },
        attempt: 1,
      },
    });

    const summary = screen.getByRole("region", {
      name: "No pudimos registrar tu Hoja de Reclamación",
    });
    expect(summary).toHaveTextContent("Inténtalo de nuevo.");
    expect(field(/^Detalle/)).toHaveValue("Dejó de funcionar.");
    await waitFor(() =>
      expect(
        within(summary).getByRole("link", {
          name: "No encontramos ese distrito.",
        }),
      ).toHaveAttribute("href", "#hoja-distrito"),
    );
  });

  it("offers the no-JavaScript ubigeo refresh after the submit button", () => {
    renderForm();

    const buttons = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("type") === "submit");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Enviar Hoja de Reclamación",
      "Actualizar provincias y distritos",
    ]);
    expect(buttons[1]).toHaveAttribute("name", "intent");
    expect(buttons[1]).toHaveClass("hidden", "noscript:inline-flex");
  });

  it("links the privacy policy", () => {
    renderForm();

    expect(
      screen.getByRole("link", { name: "Política de privacidad" }),
    ).toHaveAttribute("href", "/privacidad");
  });

  it("has no axe violations (empty and with errors)", async () => {
    const { container, user } = renderForm();
    await expectNoAxeViolations(container);

    await user.click(
      screen.getByRole("checkbox", { name: "Soy menor de edad" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Enviar Hoja de Reclamación" }),
    );
    await screen.findByRole("region", { name: "Revisa estos datos" });
    await expectNoAxeViolations(container);
  });
});
