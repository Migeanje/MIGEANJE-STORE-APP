import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { NotifyMeForm } from "./notify-me-form";

const PRODUCT = "MacBook Air de 13 pulgadas (M5)";

describe("NotifyMeForm", () => {
  it("starts as a collapsed 'Avísame cuando llegue' button", () => {
    render(<NotifyMeForm productName={PRODUCT} />);

    expect(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("opens the email form and moves focus to the field", async () => {
    const user = userEvent.setup();
    render(<NotifyMeForm productName={PRODUCT} />);

    await user.click(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    );

    expect(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("textbox", { name: /Tu correo/ })).toHaveFocus();
  });

  it("rejects an invalid email with a message tied to the field", async () => {
    const user = userEvent.setup();
    render(<NotifyMeForm productName={PRODUCT} />);
    await user.click(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    );

    await user.type(screen.getByRole("textbox"), "no-es-un-correo");
    await user.click(screen.getByRole("button", { name: "Avísame" }));

    const field = screen.getByRole("textbox", { name: /Tu correo/ });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(
      /Escribe un correo válido, por ejemplo nombre@correo.com/,
    );
    expect(field).toHaveFocus();
  });

  it("confirms a valid email on screen (nothing is sent) and keeps focus on the answer", async () => {
    const user = userEvent.setup();
    render(<NotifyMeForm productName={PRODUCT} />);
    await user.click(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    );

    await user.type(screen.getByRole("textbox"), "  ana@correo.pe ");
    await user.keyboard("{Enter}");

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      `Listo. Te escribiremos a ana@correo.pe cuando ${PRODUCT} llegue a la tienda.`,
    );
    expect(status).toHaveFocus();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("has no axe violations, open and with an error", async () => {
    const user = userEvent.setup();
    const { container } = render(<NotifyMeForm productName={PRODUCT} />);
    await expectNoAxeViolations(container);

    await user.click(
      screen.getByRole("button", { name: "Avísame cuando llegue" }),
    );
    await user.click(screen.getByRole("button", { name: "Avísame" }));

    await expectNoAxeViolations(container);
  });
});
