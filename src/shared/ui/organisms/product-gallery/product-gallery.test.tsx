import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import placeholder from "@/shared/ui/molecules/product-card/__fixtures__/placeholder.svg";
import { expectNoAxeViolations } from "@/test/a11y";
import { ProductGallery } from "./product-gallery";

const FRONT = {
  src: placeholder,
  alt: "Cargador visto de frente",
  width: 640,
  height: 640,
};
const SIDE = { ...FRONT, alt: "Cargador visto de lado" };
const PLUG = { ...FRONT, alt: "Enchufe plegable del cargador" };

describe("ProductGallery", () => {
  it("shows the first image with its alt text, without thumbnails for one image", () => {
    render(<ProductGallery images={[FRONT]} />);

    expect(
      screen.getByRole("img", { name: "Cargador visto de frente" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("offers one thumbnail button per image, the first pressed", () => {
    render(<ProductGallery images={[FRONT, SIDE, PLUG]} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Ver imagen 1 de 3",
      "Ver imagen 2 de 3",
      "Ver imagen 3 de 3",
    ]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("switches the main image with the keyboard", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={[FRONT, SIDE, PLUG]} />);

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("img", { name: "Cargador visto de lado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Cargador visto de frente" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Ver imagen 2 de 3" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("throws a RangeError without images", () => {
    expect(() => render(<ProductGallery images={[]} />)).toThrow(RangeError);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ProductGallery images={[FRONT, SIDE, PLUG]} />,
    );

    await expectNoAxeViolations(container);
  });
});
