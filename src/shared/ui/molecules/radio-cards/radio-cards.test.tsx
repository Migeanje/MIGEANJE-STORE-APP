import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { RadioCards, type RadioCardsProps } from "./radio-cards";

const OPTIONS: RadioCardsProps["options"] = [
  {
    value: "reclamo",
    label: "Reclamo",
    description: "Disconformidad relacionada a los productos o servicios.",
  },
  {
    value: "queja",
    label: "Queja",
    description:
      "Disconformidad no relacionada a los productos o servicios; o, malestar o descontento respecto a la atención al público.",
  },
];

function renderCards(props: Partial<RadioCardsProps> = {}) {
  return render(
    <RadioCards
      legend="Tipo"
      name="kind"
      idPrefix="hoja-kind"
      options={OPTIONS}
      {...props}
    />,
  );
}

describe("RadioCards", () => {
  it("groups the options under the legend, named by their label", () => {
    renderCards();

    const group = screen.getByRole("group", { name: "Tipo" });
    expect(group.tagName).toBe("FIELDSET");
    expect(screen.getByRole("radio", { name: "Reclamo" })).toHaveAttribute(
      "id",
      "hoja-kind-reclamo",
    );
    expect(screen.getByRole("radio", { name: "Queja" })).toHaveAttribute(
      "name",
      "kind",
    );
  });

  it("describes each option with its definition", () => {
    renderCards();

    expect(
      screen.getByRole("radio", { name: "Reclamo" }),
    ).toHaveAccessibleDescription(
      "Disconformidad relacionada a los productos o servicios.",
    );
  });

  it("starts with the default value and selects a whole card on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderCards({ defaultValue: "reclamo", inputProps: { onChange } });

    expect(screen.getByRole("radio", { name: "Reclamo" })).toBeChecked();
    await user.click(screen.getByText(/malestar o descontento/));

    expect(screen.getByRole("radio", { name: "Queja" })).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("moves between options with the arrow keys", async () => {
    const user = userEvent.setup();
    renderCards({ defaultValue: "reclamo" });

    screen.getByRole("radio", { name: "Reclamo" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("radio", { name: "Queja" })).toBeChecked();
  });

  it("marks the requirement and wires the error", () => {
    renderCards({
      required: true,
      error: "Elige si es un reclamo o una queja.",
    });

    const group = screen.getByRole("group", { name: "Tipo (obligatorio)" });
    expect(group).toHaveAccessibleDescription(
      "Elige si es un reclamo o una queja.",
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeRequired();
      expect(radio).toBeInvalid();
    }
  });

  it("has no axe violations (default, selected, with error)", async () => {
    const { container } = render(
      <div>
        <RadioCards legend="Tipo" name="a" idPrefix="a" options={OPTIONS} />
        <RadioCards
          legend="Tipo"
          name="b"
          idPrefix="b"
          options={OPTIONS}
          defaultValue="queja"
          columns={2}
        />
        <RadioCards
          legend="Tipo"
          name="c"
          idPrefix="c"
          options={[{ value: "x", label: "Sin descripción" }, ...OPTIONS]}
          required
          error="Elige una opción."
        />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
