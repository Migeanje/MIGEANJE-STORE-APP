import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { QuantityStepper } from "./quantity-stepper";

function getParts() {
  return {
    input: screen.getByRole("spinbutton", { name: "Cantidad" }),
    decrement: screen.getByRole("button", { name: "Disminuir cantidad" }),
    increment: screen.getByRole("button", { name: "Aumentar cantidad" }),
  };
}

describe("QuantityStepper", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a named group with a spinbutton and two named buttons", () => {
    render(<QuantityStepper label="Cantidad" max={5} />);
    const { input, decrement, increment } = getParts();

    expect(screen.getByRole("group", { name: "Cantidad" })).toContainElement(
      input,
    );
    expect(input).toHaveValue("1");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("aria-valuenow", "1");
    expect(input).toHaveAttribute("aria-valuemin", "1");
    expect(input).toHaveAttribute("aria-valuemax", "5");
    expect(decrement).toHaveAttribute("type", "button");
    expect(increment).toHaveAttribute("type", "button");
  });

  it("omits aria-valuemax without a max", () => {
    render(<QuantityStepper label="Cantidad" />);

    expect(getParts().input).not.toHaveAttribute("aria-valuemax");
  });

  it("starts at defaultValue", () => {
    render(<QuantityStepper label="Cantidad" defaultValue={3} />);

    expect(getParts().input).toHaveValue("3");
  });

  it("increments and decrements with the buttons", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<QuantityStepper label="Cantidad" onValueChange={onValueChange} />);
    const { input, decrement, increment } = getParts();

    await user.click(increment);
    await user.click(increment);
    expect(input).toHaveValue("3");
    expect(input).toHaveAttribute("aria-valuenow", "3");

    await user.click(decrement);
    expect(input).toHaveValue("2");
    expect(onValueChange.mock.calls).toEqual([[2], [3], [2]]);
  });

  it("disables each button at its bound and never leaves the range", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuantityStepper
        label="Cantidad"
        defaultValue={2}
        max={3}
        onValueChange={onValueChange}
      />,
    );
    const { input, decrement, increment } = getParts();

    await user.click(decrement);
    expect(input).toHaveValue("1");
    expect(decrement).toBeDisabled();

    await user.click(increment);
    await user.click(increment);
    expect(input).toHaveValue("3");
    expect(increment).toBeDisabled();
    expect(decrement).toBeEnabled();
    expect(onValueChange.mock.calls).toEqual([[1], [2], [3]]);
  });

  it("moves focus to the field when a button disables itself at a bound", async () => {
    const user = userEvent.setup();
    render(<QuantityStepper label="Cantidad" defaultValue={2} max={3} />);
    const { input, decrement, increment } = getParts();

    await user.tab();
    expect(decrement).toHaveFocus();
    await user.keyboard("{Enter}");

    // A disabled button cannot keep focus; it must not fall back to <body>.
    expect(decrement).toBeDisabled();
    expect(input).toHaveFocus();

    increment.focus();
    await user.keyboard("{Enter}");
    expect(increment).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(increment).toBeDisabled();
    expect(input).toHaveFocus();
  });

  it("uses 44px buttons", () => {
    render(<QuantityStepper label="Cantidad" />);
    const { decrement, increment } = getParts();

    expect(decrement).toHaveClass("size-11");
    expect(increment).toHaveClass("size-11");
  });

  it("commits a typed value on blur, clamped to the range", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuantityStepper
        label="Cantidad"
        max={10}
        onValueChange={onValueChange}
      />,
    );
    const { input } = getParts();

    await user.clear(input);
    await user.type(input, "25");
    // The draft is only committed when the field loses focus.
    expect(onValueChange).not.toHaveBeenCalled();
    await user.tab();

    expect(input).toHaveValue("10");
    expect(input).toHaveAttribute("aria-valuenow", "10");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  it("raises a typed value below the minimum to the minimum", async () => {
    const user = userEvent.setup();
    render(<QuantityStepper label="Cantidad" min={2} defaultValue={4} />);
    const { input } = getParts();

    await user.clear(input);
    await user.type(input, "0");
    await user.tab();

    expect(input).toHaveValue("2");
  });

  it("commits the typed value with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<QuantityStepper label="Cantidad" onValueChange={onValueChange} />);
    const { input } = getParts();

    await user.clear(input);
    await user.type(input, "4{Enter}");

    expect(input).toHaveValue("4");
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it("rejects characters that are not digits", async () => {
    const user = userEvent.setup();
    render(<QuantityStepper label="Cantidad" defaultValue={3} />);
    const { input } = getParts();

    await user.type(input, "a-,e");
    expect(input).toHaveValue("3");

    await user.clear(input);
    await user.paste("2.5");
    expect(input).toHaveValue("");
  });

  it("restores the last value when the field is left empty", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuantityStepper
        label="Cantidad"
        defaultValue={3}
        onValueChange={onValueChange}
      />,
    );
    const { input } = getParts();

    await user.clear(input);
    await user.tab();

    expect(input).toHaveValue("3");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("changes the value with ArrowUp and ArrowDown within the range", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <QuantityStepper
        label="Cantidad"
        max={2}
        onValueChange={onValueChange}
      />,
    );
    const { input } = getParts();

    await user.click(input);
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("2");
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("2");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("1");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveValue("1");
    expect(onValueChange.mock.calls).toEqual([[2], [1]]);
  });

  it("steps from the typed draft with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<QuantityStepper label="Cantidad" max={10} />);
    const { input } = getParts();

    await user.clear(input);
    await user.type(input, "6{ArrowUp}");

    expect(input).toHaveValue("7");
  });

  it("follows the value prop when controlled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <QuantityStepper
        label="Cantidad"
        value={2}
        onValueChange={onValueChange}
      />,
    );
    const { input, increment } = getParts();

    await user.click(increment);
    // The parent owns the state: no change until it passes the new value.
    expect(onValueChange).toHaveBeenCalledWith(3);
    expect(input).toHaveValue("2");

    rerender(
      <QuantityStepper
        label="Cantidad"
        value={3}
        onValueChange={onValueChange}
      />,
    );
    expect(input).toHaveValue("3");
  });

  it("works with a parent that owns the state", async () => {
    const user = userEvent.setup();
    function CartLine() {
      const [quantity, setQuantity] = useState(1);
      return (
        <QuantityStepper
          label="Cantidad"
          value={quantity}
          onValueChange={setQuantity}
          max={4}
        />
      );
    }
    render(<CartLine />);
    const { input, increment } = getParts();

    await user.click(increment);
    await user.clear(input);
    await user.type(input, "9");
    await user.tab();

    expect(input).toHaveValue("4");
  });

  it("disables the buttons and the field when disabled", () => {
    render(<QuantityStepper label="Cantidad" defaultValue={2} disabled />);
    const { input, decrement, increment } = getParts();

    expect(input).toBeDisabled();
    expect(decrement).toBeDisabled();
    expect(increment).toBeDisabled();
  });

  it.each([
    ["max below min", { min: 2, max: 1 }],
    ["a fractional min", { min: 1.5 }],
    ["a negative min", { min: -1 }],
    ["a fractional max", { max: 2.5 }],
  ])("throws a RangeError for %s", (_label, bounds) => {
    // React logs the render error before rethrowing it; keep the output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(<QuantityStepper label="Cantidad" {...bounds} />),
    ).toThrow(RangeError);
  });

  it("has no axe violations (default, at the max, disabled)", async () => {
    const { container } = render(
      <div>
        <QuantityStepper label="Cantidad" />
        <QuantityStepper label="Cantidad de cables" defaultValue={3} max={3} />
        <QuantityStepper label="Cantidad de cargadores" disabled />
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
