import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { PaymentPendingNotice } from "./payment-pending-notice";

describe("PaymentPendingNotice", () => {
  it("says the payment is being confirmed, with its reference and no way to pay", () => {
    render(<PaymentPendingNotice reference="MG-2026-000777" />);

    const notice = screen.getByRole("region", {
      name: "Ya registramos un pago",
    });
    expect(within(notice).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Ya registramos un pago",
    );
    expect(notice).toHaveTextContent(
      "No vuelvas a pagar; te escribiremos a tu correo.",
    );
    expect(notice).toHaveTextContent("Código de referencia: MG-2026-000777");
    expect(
      within(notice).getByRole("link", { name: "Volver al inicio" }),
    ).toHaveAttribute("href", "/");
    expect(within(notice).queryByRole("button")).toBeNull();
  });

  it("takes a lower heading level", () => {
    render(
      <PaymentPendingNotice reference="MG-2026-000777" headingLevel={4} />,
    );
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PaymentPendingNotice reference="MG-2026-000777" />,
    );
    await expectNoAxeViolations(container);
  });
});
