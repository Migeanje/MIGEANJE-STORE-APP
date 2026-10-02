import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
// Plain @testing-library/user-event, re-exported by Storybook (already a dev
// dependency): jsdom alone does not turn Enter/Space into a click.
import { uninstrumentedUserEvent as userEvent } from "storybook/test";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders a native toggle button that is not pressed by default", () => {
    render(<Chip>USB-C</Chip>);

    const chip = screen.getByRole("button", { name: "USB-C" });
    expect(chip).toHaveAttribute("type", "button");
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles aria-pressed on click when uncontrolled", () => {
    const onPressedChange = vi.fn();
    render(<Chip onPressedChange={onPressedChange}>65 W o más</Chip>);
    const chip = screen.getByRole("button", { name: "65 W o más" });

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("starts pressed with defaultPressed", () => {
    render(<Chip defaultPressed>En stock</Chip>);

    expect(screen.getByRole("button", { name: "En stock" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("follows the pressed prop when controlled", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Chip pressed={false} onPressedChange={onPressedChange}>
        GaN
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "GaN" });

    fireEvent.click(chip);
    // The parent owns the state: no change until it passes the new value.
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute("aria-pressed", "false");

    rerender(
      <Chip pressed onPressedChange={onPressedChange}>
        GaN
      </Chip>,
    );
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("works with a parent that owns the state", () => {
    function Filters() {
      const [pressed, setPressed] = useState(false);
      return (
        <Chip pressed={pressed} onPressedChange={setPressed}>
          Carga inalámbrica
        </Chip>
      );
    }
    render(<Filters />);
    const chip = screen.getByRole("button", { name: "Carga inalámbrica" });

    fireEvent.click(chip);

    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("toggles with the %s key", async (_key, keys) => {
    const user = userEvent.setup();
    render(<Chip>USB-C</Chip>);
    const chip = screen.getByRole("button", { name: "USB-C" });

    await user.tab();
    expect(chip).toHaveFocus();
    await user.keyboard(keys);

    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onClick and lets it cancel the toggle", () => {
    const onPressedChange = vi.fn();
    render(
      <Chip
        onClick={(event) => event.preventDefault()}
        onPressedChange={onPressedChange}
      >
        USB-C
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "USB-C" });

    fireEvent.click(chip);

    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("does not toggle when disabled", () => {
    const onPressedChange = vi.fn();
    render(
      <Chip disabled onPressedChange={onPressedChange}>
        Agotado
      </Chip>,
    );
    const chip = screen.getByRole("button", { name: "Agotado" });

    fireEvent.click(chip);

    expect(chip).toBeDisabled();
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it("marks the pressed state with a decorative check, not only color", () => {
    render(<Chip>USB-C</Chip>);
    const chip = screen.getByRole("button", { name: "USB-C" });
    expect(chip.querySelector("svg")).toBeNull();

    fireEvent.click(chip);

    const check = chip.querySelector("svg");
    expect(check).not.toBeNull();
    expect(check?.closest('[aria-hidden="true"]')).not.toBeNull();
    // The accessible name stays the label; aria-pressed carries the state.
    expect(chip).toHaveAccessibleName("USB-C");
  });

  it("is rounded-sm, between 36 and 44px tall, and lights up when pressed", () => {
    render(<Chip>USB-C</Chip>);

    expect(screen.getByRole("button", { name: "USB-C" })).toHaveClass(
      "rounded-sm",
      "h-9",
      "bg-surface-raised",
      "aria-pressed:border-primary",
      "aria-pressed:text-primary",
      "aria-pressed:shadow-glow",
      "focus-visible:outline-ring",
    );
  });

  it("has no axe violations (unpressed, pressed, disabled)", async () => {
    const { container } = render(
      <div>
        <Chip>USB-C</Chip>
        <Chip defaultPressed>65 W o más</Chip>
        <Chip disabled>Agotado</Chip>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
