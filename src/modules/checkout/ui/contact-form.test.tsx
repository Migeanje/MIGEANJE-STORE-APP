import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { aUbigeoTree } from "@/modules/checkout/testing/checkout-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  type ContactField,
  type FormState,
  initialFormState,
} from "./checkout-forms";
import { contactFormDefaults } from "./checkout-view";
import { ContactForm } from "./contact-form";

type Action = (
  state: FormState<ContactField>,
  data: FormData,
) => Promise<FormState<ContactField>>;

function renderForm({
  action = vi.fn<Action>(async (state) => state),
  state = initialFormState(contactFormDefaults(null)),
}: {
  action?: Action;
  state?: FormState<ContactField>;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <ContactForm action={action} initialState={state} ubigeo={aUbigeoTree()} />,
  );
  return { user, action, ...view };
}

const textbox = (name: RegExp) => screen.getByRole("textbox", { name });
const select = (name: RegExp) => screen.getByRole("combobox", { name });

async function fillValidContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(textbox(/Correo electrónico/), "ana@correo.pe");
  await user.type(textbox(/Nombres/), "Ana");
  await user.type(textbox(/Apellidos/), "Pérez Quispe");
  await user.type(textbox(/Número de documento/), "46027897");
  await user.type(textbox(/Celular/), "987654321");
  await user.type(textbox(/^Dirección/), "Av. Larco 1234");
  await user.selectOptions(select(/Departamento/), "15");
  await user.selectOptions(select(/Provincia/), "1501");
  await user.selectOptions(select(/Distrito/), "150122");
}

describe("ContactForm", () => {
  it("asks for the contact and the delivery address with autocomplete hints", () => {
    renderForm();

    expect(textbox(/Correo electrónico/)).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(textbox(/Nombres/)).toHaveAttribute("autocomplete", "given-name");
    expect(textbox(/Apellidos/)).toHaveAttribute("autocomplete", "family-name");
    expect(select(/Tipo de documento/)).toHaveValue("dni");
    expect(textbox(/Celular/)).toHaveAttribute("type", "tel");
    expect(textbox(/Referencia/)).not.toBeRequired();
    expect(
      screen.getByRole("button", { name: "Continuar al comprobante" }),
    ).toHaveAttribute("type", "submit");
  });

  it("fills the fields from the saved values", () => {
    renderForm({
      state: initialFormState({
        ...contactFormDefaults(null),
        email: "ana@correo.pe",
        departamento: "15",
        provincia: "1501",
        distrito: "150122",
      }),
    });

    expect(textbox(/Correo electrónico/)).toHaveValue("ana@correo.pe");
    expect(select(/Departamento/)).toHaveValue("15");
    expect(select(/Provincia/)).toHaveValue("1501");
    expect(select(/Distrito/)).toHaveValue("150122");
  });

  it("filters provincias and distritos as you pick, and resets them on change", async () => {
    const { user } = renderForm();

    await user.selectOptions(select(/Departamento/), "15");
    expect(
      within(select(/Provincia/))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Elige una provincia", "Cañete", "Lima"]);
    await user.selectOptions(select(/Provincia/), "1501");
    await user.selectOptions(select(/Distrito/), "150122");

    await user.selectOptions(select(/Departamento/), "07");
    expect(select(/Provincia/)).toHaveValue("");
    expect(select(/Distrito/)).toHaveValue("");
    expect(
      within(select(/Distrito/))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Primero elige una provincia"]);
  });

  it("shows an inline error once you leave a field", async () => {
    const { user } = renderForm();

    await user.type(textbox(/Correo electrónico/), "ana@");
    await user.tab();

    const email = textbox(/Correo electrónico/);
    await waitFor(() => expect(email).toBeInvalid());
    expect(email).toHaveAccessibleDescription(
      expect.stringContaining(
        "Revisa tu correo: debe ser como nombre@correo.com.",
      ),
    );
  });

  it("lists the errors on submit, moves focus there and does not post", async () => {
    const { user, action } = renderForm();

    await user.click(
      screen.getByRole("button", { name: "Continuar al comprobante" }),
    );

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(
      within(summary).getByRole("link", {
        name: "Escribe tu correo electrónico.",
      }),
    ).toHaveAttribute("href", "#checkout-email");
    expect(
      within(summary).getByRole("link", { name: "Elige tu distrito." }),
    ).toHaveAttribute("href", "#checkout-distrito");
    expect(action).not.toHaveBeenCalled();
  });

  it("posts the typed values once they are valid", async () => {
    const { user, action } = renderForm();

    await fillValidContact(user);
    await user.click(
      screen.getByRole("button", { name: "Continuar al comprobante" }),
    );

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(Object.fromEntries(data)).toMatchObject({
      email: "ana@correo.pe",
      documentType: "dni",
      documentNumber: "46027897",
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
    });
    expect(data.has("intent")).toBe(false);
  });

  it("shows the server's errors and focuses the summary", async () => {
    const action = vi.fn<Action>(async (state) => ({
      ...state,
      errors: {
        distrito: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
      },
      attempt: state.attempt + 1,
    }));
    const { user } = renderForm({ action });

    await fillValidContact(user);
    await user.click(
      screen.getByRole("button", { name: "Continuar al comprobante" }),
    );

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(select(/Distrito/)).toHaveAccessibleDescription(
      "No encontramos ese distrito. Elige tu ubicación de nuevo.",
    );
  });

  it("renders errors that came with the page (no JavaScript)", () => {
    renderForm({
      state: {
        ...initialFormState(contactFormDefaults(null)),
        errors: { phone: "Escribe tu celular." },
        attempt: 1,
      },
    });
    expect(textbox(/Celular/)).toHaveAccessibleDescription(
      expect.stringContaining("Escribe tu celular."),
    );
    expect(
      screen.getByRole("region", { name: "Revisa estos datos" }),
    ).toBeInTheDocument();
  });

  it("has a refresh button for the ubigeo options without JavaScript", () => {
    renderForm();
    const refresh = screen.getByRole("button", {
      name: "Actualizar provincias y distritos",
    });
    expect(refresh).toHaveAttribute("name", "intent");
    expect(refresh).toHaveAttribute("value", "ubigeo");
    expect(refresh).toHaveClass("hidden", "noscript:inline-flex");
  });

  it("has no axe violations, empty or with errors", async () => {
    const { container, user } = renderForm();
    await expectNoAxeViolations(container);

    await user.click(
      screen.getByRole("button", { name: "Continuar al comprobante" }),
    );
    await screen.findByRole("region", { name: "Revisa estos datos" });
    await expectNoAxeViolations(container);
  });
});
