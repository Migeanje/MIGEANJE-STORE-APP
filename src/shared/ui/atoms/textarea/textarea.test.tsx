import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { FieldError } from "../field-error";
import { Label } from "../label";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders a native multi-line text field", () => {
    render(<Textarea aria-label="Detalle" />);

    const field = screen.getByRole("textbox", { name: "Detalle" });
    expect(field.tagName).toBe("TEXTAREA");
  });

  it("looks like the Input but grows vertically", () => {
    render(<Textarea aria-label="Detalle" />);

    const field = screen.getByRole("textbox", { name: "Detalle" });
    expect(field).toHaveClass(
      "rounded-md",
      "bg-card",
      "border-input",
      "focus-visible:outline-ring",
      "aria-invalid:border-destructive",
      "min-h-32",
      "resize-y",
    );
    expect(field).not.toHaveClass("h-11");
  });

  it("forwards native props, the ref and typed text", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLTextAreaElement>();
    render(
      <Textarea
        ref={ref}
        aria-label="Pedido"
        name="request"
        maxLength={20}
        rows={6}
        className="max-w-prose"
      />,
    );
    const field = screen.getByRole("textbox", { name: "Pedido" });

    await user.type(field, "Cambio del producto");

    expect(ref.current).toBe(field);
    expect(field).toHaveValue("Cambio del producto");
    expect(field).toHaveAttribute("name", "request");
    expect(field).toHaveAttribute("maxlength", "20");
    expect(field).toHaveAttribute("rows", "6");
    expect(field).toHaveClass("max-w-prose", "w-full");
  });

  it("has no axe violations (default, invalid, disabled, composed)", async () => {
    const { container } = render(
      <div>
        <Textarea aria-label="Detalle" />
        <Textarea aria-label="Pedido" disabled />
        <Label htmlFor="detail" required>
          Detalle
        </Label>
        <Textarea
          id="detail"
          required
          aria-invalid="true"
          aria-describedby="detail-error"
        />
        <FieldError id="detail-error">Cuéntanos qué pasó.</FieldError>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
