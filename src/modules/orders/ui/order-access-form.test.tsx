import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import type { UnlockOrderState } from "./actions";
import { OrderAccessForm } from "./order-access-form";

vi.mock("./actions", () => ({}));

type Action = (
  state: UnlockOrderState,
  data: FormData,
) => Promise<UnlockOrderState>;

describe("OrderAccessForm", () => {
  it("asks for the email of the order and posts it with the number", async () => {
    const user = userEvent.setup();
    const action = vi.fn<Action>(async () => ({
      message: "No encontramos un pedido con ese número y correo.",
    }));
    render(<OrderAccessForm number="MG-2026-424242" action={action} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Confirma tu correo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("MG-2026-424242")).toHaveClass("font-mono");
    await user.type(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
      "ana@correo.pe",
    );
    await user.click(screen.getByRole("button", { name: "Ver mi pedido" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const data = vi.mocked(action).mock.calls[0]?.[1] as FormData;
    expect(data.get("number")).toBe("MG-2026-424242");
    expect(data.get("email")).toBe("ana@correo.pe");
    expect(
      await screen.findByText(
        "No encontramos un pedido con ese número y correo.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toBeInvalid();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <OrderAccessForm number="MG-2026-424242" action={vi.fn<Action>()} />,
    );
    await expectNoAxeViolations(container);
  });
});
