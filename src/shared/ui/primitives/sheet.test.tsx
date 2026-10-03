import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

function Demo({ side }: { side?: "left" | "right" }) {
  return (
    <Sheet>
      <SheetTrigger>Abrir panel</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Panel</SheetTitle>
          <SheetDescription>Opciones de la tienda.</SheetDescription>
        </SheetHeader>
        <a href="/cuenta">Mi cuenta</a>
        <SheetClose>Listo</SheetClose>
      </SheetContent>
    </Sheet>
  );
}

describe("Sheet", () => {
  it("opens a modal dialog named by its title, with focus inside", async () => {
    const user = userEvent.setup();
    render(<Demo />);

    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));

    const dialog = screen.getByRole("dialog", { name: "Panel" });
    expect(dialog).toHaveAccessibleDescription("Opciones de la tienda.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Abrir panel" });

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("traps Tab inside the panel", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));
    const dialog = screen.getByRole("dialog");

    for (let step = 0; step < 5; step += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("has a 44px close button named in Spanish", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));

    const close = screen.getByRole("button", { name: "Cerrar" });
    expect(close).toHaveClass("size-11");

    await user.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("slides in from the chosen side and opts out of smooth scroll", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Demo side="left" />);
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("left-0", "starting:-translate-x-full");
    // Lenis (discovery pages) must not scroll the page behind the panel.
    expect(dialog).toHaveAttribute("data-lenis-prevent");
    expect(
      document.querySelector('[data-slot="sheet-overlay"]'),
    ).toHaveAttribute("data-lenis-prevent");
    unmount();

    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));
    expect(screen.getByRole("dialog")).toHaveClass("right-0");
  });

  it("has no axe violations when open", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Abrir panel" }));

    await expectNoAxeViolations(document.body);
  });
});
