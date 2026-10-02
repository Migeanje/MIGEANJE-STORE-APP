import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations, runAxe } from "./a11y";

// Guards the helper itself: if axe stopped running in jsdom, every component
// test would pass vacuously.
describe("axe helper", () => {
  it("reports a button without an accessible name", async () => {
    const { container } = render(<button type="button" />);

    const violations = await runAxe(container);

    expect(violations.map((violation) => violation.id)).toContain(
      "button-name",
    );
    await expect(expectNoAxeViolations(container)).rejects.toThrow(
      /button-name/,
    );
  });

  it("passes accessible markup", async () => {
    const { container } = render(
      <button type="button">Agregar al carrito</button>,
    );

    await expect(expectNoAxeViolations(container)).resolves.toBeUndefined();
  });
});
