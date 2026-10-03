import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { ProductPageTemplate } from "./product-page";

function renderTemplate(extra: { related?: boolean; details?: boolean } = {}) {
  return render(
    <ProductPageTemplate
      gallery={<p>Galería</p>}
      header={<h1>Prime Charger 100W</h1>}
      options={<p>Opciones</p>}
      purchase={<p>Caja de compra</p>}
      related={extra.related ? <h2>También te puede interesar</h2> : undefined}
    >
      {extra.details ? <h2>Especificaciones</h2> : null}
    </ProductPageTemplate>,
  );
}

describe("ProductPageTemplate", () => {
  it("orders the slots for phones: gallery, header, options, buy box, details, related", () => {
    const { container } = renderTemplate({ related: true, details: true });

    expect(container.textContent).toBe(
      "GaleríaPrime Charger 100WOpcionesCaja de compraEspecificacionesTambién te puede interesar",
    );
  });

  it("makes the buy box sticky from lg", () => {
    renderTemplate();

    expect(
      screen.getByText("Caja de compra").closest("[data-slot=purchase]"),
    ).toHaveClass("lg:sticky");
  });

  it("leaves out empty details and related products", () => {
    const { container } = renderTemplate();

    expect(container.textContent).toBe(
      "GaleríaPrime Charger 100WOpcionesCaja de compra",
    );
  });

  it("has no axe violations", async () => {
    const { container } = renderTemplate({ related: true, details: true });

    await expectNoAxeViolations(container);
  });
});
