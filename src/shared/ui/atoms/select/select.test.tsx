import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Select } from "./select";

function Options() {
  return (
    <>
      <option value="">Elige un tipo</option>
      <option value="dni">DNI</option>
      <option value="ce">Carné de extranjería</option>
    </>
  );
}

describe("Select", () => {
  it("renders a native select with the input styles and a decorative chevron", () => {
    const { container } = render(
      <Select aria-label="Tipo de documento">
        <Options />
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "Tipo de documento" });
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveClass(
      "h-11",
      "rounded-md",
      "appearance-none",
      "pr-10",
    );
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("forwards native props, events and the ref", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLSelectElement>();
    const onChange = vi.fn();
    render(
      <Select
        ref={ref}
        aria-label="Tipo de documento"
        name="documentType"
        defaultValue="dni"
        onChange={onChange}
      >
        <Options />
      </Select>,
    );

    expect(ref.current).toHaveValue("dni");
    expect(ref.current).toHaveAttribute("name", "documentType");
    await user.selectOptions(ref.current as HTMLSelectElement, "ce");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ref.current).toHaveValue("ce");
  });

  it("merges classes onto the select", () => {
    render(
      <Select aria-label="Tipo" className="w-40">
        <Options />
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveClass("w-40");
  });

  it("has no axe violations, valid or invalid", async () => {
    const { container } = render(
      <>
        <label htmlFor="tipo">Tipo de documento</label>
        <Select id="tipo">
          <Options />
        </Select>
        <label htmlFor="tipo-invalido">Tipo inválido</label>
        <Select id="tipo-invalido" aria-invalid="true">
          <Options />
        </Select>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});
