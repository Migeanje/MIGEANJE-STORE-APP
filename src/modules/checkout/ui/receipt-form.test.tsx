import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  type FormState,
  initialFormState,
  type ReceiptField,
} from "./checkout-forms";
import { receiptFormDefaults } from "./checkout-view";
import { ReceiptForm } from "./receipt-form";

type Action = (
  state: FormState<ReceiptField>,
  data: FormData,
) => Promise<FormState<ReceiptField>>;

const BOLETA_FOR = {
  name: "Ana Pérez Quispe",
  document: "DNI 46027897",
  email: "ana@correo.pe",
};

function renderForm({
  facturaEnabled = false,
  action = vi.fn<Action>(async (state) => state),
}: {
  facturaEnabled?: boolean;
  action?: Action;
} = {}) {
  const user = userEvent.setup();
  const view = render(
    <ReceiptForm
      action={action}
      initialState={initialFormState(receiptFormDefaults(null))}
      facturaEnabled={facturaEnabled}
      boletaFor={BOLETA_FOR}
    />,
  );
  return { user, action, ...view };
}

describe("ReceiptForm", () => {
  it("issues a boleta to the customer's document while facturas are off", async () => {
    const { user, action } = renderForm();

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(/Boleta de venta electrónica/)).toBeInTheDocument();
    expect(
      screen.getByText(/Ana Pérez Quispe · DNI 46027897/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ana@correo\.pe/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar al pago" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(data.get("receiptType")).toBe("boleta");
  });

  it("offers boleta or factura when facturas are on", () => {
    renderForm({ facturaEnabled: true });

    expect(
      screen.getByRole("radio", { name: /Boleta de venta electrónica/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Factura electrónica/ }),
    ).not.toBeChecked();
    expect(screen.getByRole("textbox", { name: /RUC/ })).toHaveAttribute(
      "inputmode",
      "numeric",
    );
  });

  it("validates the factura fields before posting", async () => {
    const { user, action } = renderForm({ facturaEnabled: true });

    await user.click(
      screen.getByRole("radio", { name: /Factura electrónica/ }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /RUC/ }),
      "20131312954",
    );
    await user.click(screen.getByRole("button", { name: "Continuar al pago" }));

    const summary = await screen.findByRole("region", {
      name: "Revisa estos datos",
    });
    expect(summary).toHaveTextContent(
      "Revisa el RUC: el último dígito no coincide.",
    );
    expect(summary).toHaveTextContent("Escribe la razón social.");
    expect(action).not.toHaveBeenCalled();
  });

  it("has no axe violations, with facturas off and on", async () => {
    const { container, unmount } = renderForm();
    await expectNoAxeViolations(container);
    unmount();

    const enabled = renderForm({ facturaEnabled: true });
    await expectNoAxeViolations(enabled.container);
  });
});
