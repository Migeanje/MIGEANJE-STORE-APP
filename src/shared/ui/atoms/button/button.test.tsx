import { fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { Button, buttonVariants } from "./button";

const VARIANTS = ["primary", "secondary", "ghost", "destructive"] as const;
const SIZES = ["sm", "md", "lg"] as const;

describe("Button", () => {
  it("renders a native button that defaults to type=button", () => {
    render(<Button>Agregar al carrito</Button>);

    expect(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    ).toHaveAttribute("type", "button");
  });

  it("keeps an explicit type", () => {
    render(<Button type="submit">Pagar ahora</Button>);

    expect(screen.getByRole("button", { name: "Pagar ahora" })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("calls onClick when enabled", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Comprar ahora</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Comprar ahora" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Comprar ahora
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Comprar ahora" });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not busy by default", () => {
    render(<Button>Agregar al carrito</Button>);

    expect(
      screen.getByRole("button", { name: "Agregar al carrito" }),
    ).not.toHaveAttribute("aria-busy");
  });

  it("while loading: is busy, disabled, keeps its name and ignores clicks", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Agregar al carrito
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Agregar al carrito" });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows a decorative spinner only while loading", () => {
    const { rerender } = render(<Button>Agregar al carrito</Button>);
    const button = screen.getByRole("button", { name: "Agregar al carrito" });
    expect(button.querySelector("svg")).toBeNull();

    rerender(<Button loading>Agregar al carrito</Button>);

    const spinner = button.querySelector("svg");
    expect(spinner).not.toBeNull();
    expect(spinner?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders leading and trailing icons hidden from assistive tech", () => {
    render(
      <Button
        leadingIcon={<svg data-testid="leading" />}
        trailingIcon={<svg data-testid="trailing" />}
      >
        Agregar al carrito
      </Button>,
    );

    // The accessible name stays the label: the icons add nothing to it.
    const button = screen.getByRole("button", { name: "Agregar al carrito" });
    for (const id of ["leading", "trailing"]) {
      const icon = screen.getByTestId(id);
      expect(button).toContainElement(icon);
      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("renders its child with the button styles via asChild", () => {
    render(
      <Button asChild variant="secondary" size="lg">
        <Link href="/productos/cargador-gan-65w">Ver producto</Link>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ver producto" });
    expect(link).toHaveAttribute("href", "/productos/cargador-gan-65w");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveClass(
      ...buttonVariants({ variant: "secondary", size: "lg" }).split(" "),
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps icons inside the child when used with asChild", () => {
    render(
      <Button asChild trailingIcon={<svg data-testid="trailing" />}>
        <Link href="/carrito">Ir al carrito</Link>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ir al carrito" });
    expect(link).toContainElement(screen.getByTestId("trailing"));
  });

  it("merges a custom className over the variant styles", () => {
    render(<Button className="w-full">Comprar ahora</Button>);

    expect(screen.getByRole("button", { name: "Comprar ahora" })).toHaveClass(
      "w-full",
      "rounded-pill",
    );
  });

  it.each(VARIANTS)(
    "has no axe violations as %s (enabled, disabled, loading)",
    async (variant) => {
      const { container } = render(
        <div>
          <Button variant={variant}>Agregar al carrito</Button>
          <Button variant={variant} disabled>
            Agregar al carrito
          </Button>
          <Button variant={variant} loading>
            Agregar al carrito
          </Button>
        </div>,
      );

      await expectNoAxeViolations(container);
    },
  );

  it.each(SIZES)("has no axe violations at size %s", async (size) => {
    const { container } = render(
      <Button size={size} leadingIcon={<svg />}>
        Agregar al carrito
      </Button>,
    );

    await expectNoAxeViolations(container);
  });

  it("has no axe violations as a link", async () => {
    const { container } = render(
      <Button asChild variant="ghost">
        <Link href="/productos">Ver todos los productos</Link>
      </Button>,
    );

    await expectNoAxeViolations(container);
  });
});
