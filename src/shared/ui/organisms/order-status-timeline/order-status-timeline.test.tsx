import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  type OrderStatusStep,
  OrderStatusTimeline,
} from "./order-status-timeline";

const PAID = {
  label: "29 sept. 2026, 10:05",
  dateTime: "2026-09-29T15:05:00Z",
};

const IMPORTING: OrderStatusStep[] = [
  { id: "pagado", label: "Pagado", state: "done", reachedAt: PAID },
  {
    id: "en_importacion",
    label: "En importación",
    description: "Pedimos tus productos al proveedor.",
    state: "current",
    reachedAt: PAID,
  },
  { id: "preparando", label: "Preparando tu pedido", state: "pending" },
  { id: "en_camino", label: "En camino", state: "pending" },
  { id: "entregado", label: "Entregado", state: "pending" },
];

const DELIVERED: OrderStatusStep[] = [
  { id: "pagado", label: "Pagado", state: "done", reachedAt: PAID },
  {
    id: "preparando",
    label: "Preparando tu pedido",
    state: "done",
    reachedAt: PAID,
  },
  { id: "en_camino", label: "En camino", state: "done", reachedAt: PAID },
  { id: "entregado", label: "Entregado", state: "current", reachedAt: PAID },
];

describe("OrderStatusTimeline", () => {
  it("lists every status in order", () => {
    render(<OrderStatusTimeline aria-label="Estado" steps={IMPORTING} />);

    const items = within(
      screen.getByRole("list", { name: "Estado" }),
    ).getAllByRole("listitem");
    expect(items.map((item) => item.dataset.state)).toEqual([
      "done",
      "current",
      "pending",
      "pending",
      "pending",
    ]);
    expect(items[0]).toHaveTextContent("Pagado");
    expect(items[4]).toHaveTextContent("Entregado");
  });

  it("marks only the current status, with text and aria-current", () => {
    render(<OrderStatusTimeline steps={IMPORTING} />);

    const current = screen
      .getAllByRole("listitem")
      .filter((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("En importación");
    expect(current[0]).toHaveTextContent("Estado actual");
    expect(current[0]).toHaveTextContent("Pedimos tus productos al proveedor.");
  });

  it("says in words what is done and what is pending, with dates", () => {
    render(<OrderStatusTimeline steps={IMPORTING} />);
    const [paid, , preparing] = screen.getAllByRole("listitem");

    expect(paid).toHaveTextContent("Completado");
    const time = paid?.querySelector("time");
    expect(time).toHaveAttribute("datetime", PAID.dateTime);
    expect(time).toHaveTextContent(PAID.label);
    expect(preparing).toHaveTextContent("Pendiente");
    expect(preparing?.querySelector("time")).toBeNull();
  });

  it("lights the LEDs: filled when done, glowing when current, a ring when pending", () => {
    const { container } = render(<OrderStatusTimeline steps={IMPORTING} />);
    const leds = [...container.querySelectorAll('[data-slot="led"]')];

    expect(leds[0]).toHaveClass("bg-primary");
    expect(leds[0]).not.toHaveClass("shadow-glow");
    expect(leds[1]).toHaveClass("bg-primary", "shadow-glow");
    expect(leds[2]).toHaveClass("border-led-off");
    for (const led of leds) expect(led).toHaveAttribute("aria-hidden", "true");
  });

  it("throws a RangeError unless exactly one current status follows the done ones", () => {
    const noCurrent = IMPORTING.map((step) =>
      step.state === "current" ? { ...step, state: "done" as const } : step,
    );
    const doneAfterPending = [
      ...IMPORTING.slice(0, 3),
      { ...IMPORTING[3], state: "done" as const } as OrderStatusStep,
      IMPORTING[4] as OrderStatusStep,
    ];
    expect(() => render(<OrderStatusTimeline steps={noCurrent} />)).toThrow(
      RangeError,
    );
    expect(() =>
      render(<OrderStatusTimeline steps={doneAfterPending} />),
    ).toThrow(RangeError);
  });

  it("has no axe violations, in progress and delivered", async () => {
    const { container, rerender } = render(
      <OrderStatusTimeline aria-label="Estado" steps={IMPORTING} />,
    );
    await expectNoAxeViolations(container);

    rerender(<OrderStatusTimeline aria-label="Estado" steps={DELIVERED} />);
    expect(screen.getAllByText(/^Completado/)).toHaveLength(3);
    await expectNoAxeViolations(container);
  });
});
