import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { PrintButton } from "./print-button";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PrintButton", () => {
  it("opens the browser's print dialog", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PrintButton>Imprimir o guardar como PDF</PrintButton>);

    await user.click(
      screen.getByRole("button", { name: "Imprimir o guardar como PDF" }),
    );

    expect(print).toHaveBeenCalledOnce();
  });

  it("never prints itself and explains what to do without JavaScript", () => {
    render(
      <PrintButton noScriptHint="Usa la opción Imprimir de tu navegador.">
        Imprimir
      </PrintButton>,
    );

    const button = screen.getByRole("button", { name: "Imprimir" });
    expect(button).toHaveClass("print:hidden", "noscript:hidden");
    expect(button).toHaveAttribute("type", "button");
    const hint = screen.getByText("Usa la opción Imprimir de tu navegador.");
    expect(hint).toHaveClass("hidden", "noscript:block", "print:hidden");
  });

  it("has no axe violations (with and without hint)", async () => {
    const { container } = render(
      <div>
        <PrintButton>Imprimir</PrintButton>
        <PrintButton variant="secondary" noScriptHint="Usa Imprimir.">
          Imprimir constancia
        </PrintButton>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
