import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Tag } from "./tag";

describe("Tag", () => {
  it("renders a static, non-interactive label", () => {
    render(<Tag>Carga rápida</Tag>);

    const tag = screen.getByText("Carga rápida");
    expect(tag.tagName).toBe("SPAN");
    expect(tag).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("is a small caption on the raised surface with rounded-sm corners", () => {
    render(<Tag>Nuevo</Tag>);

    expect(screen.getByText("Nuevo")).toHaveClass(
      "rounded-sm",
      "bg-surface-raised",
      "text-caption",
      "font-sans",
    );
  });

  it.each(["65 W", "USB-C", "GaN"])(
    "shows the spec value %s in Geist Mono",
    (spec) => {
      render(<Tag mono>{spec}</Tag>);

      const tag = screen.getByText(spec);
      expect(tag).toHaveClass("font-mono");
      expect(tag).not.toHaveClass("font-sans");
    },
  );

  it("forwards native props and merges className", () => {
    render(
      <Tag title="Nitruro de galio" className="text-body-sm" mono>
        GaN
      </Tag>,
    );
    const tag = screen.getByText("GaN");

    expect(tag).toHaveAttribute("title", "Nitruro de galio");
    expect(tag).toHaveClass("text-body-sm");
    expect(tag).not.toHaveClass("text-caption");
  });

  it("has no axe violations (sans and mono)", async () => {
    const { container } = render(
      <div>
        <Tag>Nuevo</Tag>
        <Tag mono>65 W</Tag>
        <Tag mono>USB-C</Tag>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
