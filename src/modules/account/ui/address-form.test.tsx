import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, type Mock, vi } from "vitest";
import { aUbigeoTree } from "@/modules/checkout/testing/checkout-builders";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { expectNoAxeViolations } from "@/test/a11y";
import type { AddressFormState } from "./account-forms";
import { AddressForm, type SaveAddressAction } from "./address-form";

function renderForm({
  action = vi.fn<SaveAddressAction>(async (state) => state),
  initialState = initialFormState(),
}: {
  action?: Mock<SaveAddressAction>;
  initialState?: AddressFormState;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <AddressForm
      action={action}
      initialState={initialState}
      ubigeo={aUbigeoTree()}
      cancelHref="/cuenta/direcciones"
    />,
  );
  return { user, action, ...view };
}

const select = (name: RegExp) => screen.getByRole("combobox", { name });

describe("AddressForm", () => {
  it("adds an address with cascading ubigeo selects", async () => {
    const { user, action, container } = renderForm();

    await user.type(
      screen.getByRole("textbox", { name: /^Dirección/ }),
      "Av. Larco 1234",
    );
    await user.selectOptions(select(/Departamento/), "15");
    await user.selectOptions(select(/Provincia/), "1501");
    expect(
      within(select(/Distrito/)).getByRole("option", { name: "Miraflores" }),
    ).toBeInTheDocument();
    await user.selectOptions(select(/Distrito/), "150122");
    await user.click(
      screen.getByRole("checkbox", { name: "Usar como dirección principal" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar dirección" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = Object.fromEntries(action.mock.calls[0]?.[1] as FormData);
    expect(data).toMatchObject({
      addressId: "",
      addressLine: "Av. Larco 1234",
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
      makeDefault: "si",
    });
    expect(screen.queryByRole("link", { name: "Cancelar" })).toBeNull();
    await expectNoAxeViolations(container);
  });

  it("checks the street and the place before posting", async () => {
    const { user, action } = renderForm();

    await user.click(screen.getByRole("button", { name: "Guardar dirección" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    expect(summary).toHaveTextContent("Escribe tu dirección.");
    expect(summary).toHaveTextContent("Elige tu departamento.");
    expect(action).not.toHaveBeenCalled();
  });

  it("edits an address: filled in, with 'Guardar cambios' and 'Cancelar'", async () => {
    const { container } = renderForm({
      initialState: initialFormState({
        addressId: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
        label: "Casa",
        addressLine: "Av. Larco 1234",
        addressReference: "",
        departamento: "15",
        provincia: "1501",
        distrito: "150122",
        makeDefault: "si",
      }),
    });

    expect(select(/Distrito/)).toHaveValue("150122");
    expect(
      screen.getByRole("checkbox", { name: "Usar como dirección principal" }),
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Guardar cambios" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute(
      "href",
      "/cuenta/direcciones",
    );
    expect(
      container.querySelector('input[type="hidden"][name="addressId"]'),
    ).toHaveValue("5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21");
  });

  it("offers the no-JavaScript ubigeo refresh after the main submit", () => {
    renderForm();
    const buttons = screen.getAllByRole("button");
    const refresh = screen.getByRole("button", {
      name: "Actualizar provincias y distritos",
    });
    expect(refresh).toHaveAttribute("name", "intent");
    expect(refresh).toHaveAttribute("value", "ubigeo");
    expect(buttons.indexOf(refresh)).toBeGreaterThan(
      buttons.indexOf(
        screen.getByRole("button", { name: "Guardar dirección" }),
      ),
    );
  });
});
