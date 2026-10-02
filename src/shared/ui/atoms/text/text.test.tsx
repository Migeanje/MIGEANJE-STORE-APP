import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Text } from "./text";

const SIZES = ["body", "body-sm", "caption"] as const;
const ELEMENTS = ["p", "span", "div"] as const;

describe("Text", () => {
  it("renders a body paragraph in the default tone by default", () => {
    render(<Text>Envíos a todo el Perú.</Text>);

    const text = screen.getByText("Envíos a todo el Perú.");
    expect(text.tagName).toBe("P");
    expect(text).toHaveClass("text-body", "text-foreground", "font-sans");
  });

  it.each(ELEMENTS)("renders as <%s>", (as) => {
    render(<Text as={as}>Garantía de 12 meses</Text>);

    expect(screen.getByText("Garantía de 12 meses").tagName).toBe(
      as.toUpperCase(),
    );
  });

  it.each(SIZES)("applies the %s type token", (size) => {
    render(<Text size={size}>Pago seguro</Text>);

    expect(screen.getByText("Pago seguro")).toHaveClass(`text-${size}`);
  });

  it("uses the muted foreground for the muted tone", () => {
    render(<Text tone="muted">Precios incluyen IGV.</Text>);

    const text = screen.getByText("Precios incluyen IGV.");
    expect(text).toHaveClass("text-muted-foreground");
    expect(text).not.toHaveClass("text-foreground");
  });

  it("switches to Geist Mono for data", () => {
    render(
      <Text mono size="body-sm">
        SKU MGJ-GAN-65W
      </Text>,
    );

    const text = screen.getByText("SKU MGJ-GAN-65W");
    expect(text).toHaveClass("font-mono");
    expect(text).not.toHaveClass("font-sans");
  });

  it("forwards native props and merges className", () => {
    render(
      <Text id="nota" className="text-caption">
        Nota
      </Text>,
    );
    const text = screen.getByText("Nota");

    expect(text).toHaveAttribute("id", "nota");
    expect(text).toHaveClass("text-caption");
    expect(text).not.toHaveClass("text-body");
  });

  it("has no axe violations in every size, tone and element", async () => {
    const { container } = render(
      <div>
        {SIZES.map((size) => (
          <Text key={size} size={size}>
            Texto {size}
          </Text>
        ))}
        <Text tone="muted">Texto secundario</Text>
        <Text as="span" mono>
          Pedido N.º 000123
        </Text>
        <Text as="div">Bloque</Text>
      </div>,
    );

    await expectNoAxeViolations(container);
  });
});
