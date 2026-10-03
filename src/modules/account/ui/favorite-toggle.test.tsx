import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import {
  FavoriteSignInLink,
  FavoriteToggle,
  type ToggleFavoriteAction,
} from "./favorite-toggle";
import type { FavoriteToggleState } from "./favorite-toggle-state";

const SLUG = "soundcore-liberty-5";
const RETURN_TO = "/productos/soundcore-liberty-5";

type Deferred = {
  promise: Promise<FavoriteToggleState>;
  resolve: (state: FavoriteToggleState) => void;
};
function deferred(): Deferred {
  let resolve: Deferred["resolve"] = () => {};
  const promise = new Promise<FavoriteToggleState>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("FavoriteToggle", () => {
  it("is a toggle button that posts the opposite state", async () => {
    const { container } = render(
      <FavoriteToggle
        slug={SLUG}
        initialFavorite={false}
        action={vi.fn()}
        returnTo={RETURN_TO}
      />,
    );

    const button = screen.getByRole("button", { name: "Guardar en favoritos" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("aria-pressed", "false");
    const fields = Object.fromEntries(
      new FormData(container.querySelector("form") as HTMLFormElement),
    );
    expect(fields).toEqual({ slug: SLUG, volver: RETURN_TO, favorito: "si" });
    await expectNoAxeViolations(container);
  });

  it("shows the new state at once and announces the answer", async () => {
    const user = userEvent.setup();
    const answer = deferred();
    const action = vi.fn<ToggleFavoriteAction>(() => answer.promise);
    render(
      <FavoriteToggle
        slug={SLUG}
        initialFavorite={false}
        action={action}
        returnTo={RETURN_TO}
      />,
    );
    const button = screen.getByRole("button", { name: "Guardar en favoritos" });

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    const posted = action.mock.calls[0]?.[1] as FormData;
    expect(posted.get("favorito")).toBe("si");

    await act(async () => {
      answer.resolve({
        favorite: true,
        message: "Guardamos el producto en tus favoritos.",
        tone: "default",
        attempt: 1,
      });
    });

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Guardamos el producto en tus favoritos.",
    );
  });

  it("goes back to the real state when the server refuses", async () => {
    const user = userEvent.setup();
    const action = vi.fn<ToggleFavoriteAction>(async (state) => ({
      ...state,
      message: "Tu lista de favoritos está llena: quita uno para guardar otro.",
      tone: "error",
      attempt: state.attempt + 1,
    }));
    render(
      <FavoriteToggle
        slug={SLUG}
        initialFavorite={false}
        action={action}
        returnTo={RETURN_TO}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Guardar en favoritos" }),
    );

    expect(
      await screen.findByText(
        "Tu lista de favoritos está llena: quita uno para guardar otro.",
      ),
    ).toHaveClass("text-destructive");
    expect(
      screen.getByRole("button", { name: "Guardar en favoritos" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("is pressed for a product already saved, and asks to remove it", () => {
    const { container } = render(
      <FavoriteToggle
        slug={SLUG}
        initialFavorite
        action={vi.fn()}
        returnTo={RETURN_TO}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Guardar en favoritos" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector('input[name="favorito"]')).toHaveAttribute(
      "value",
      "no",
    );
  });
});

describe("FavoriteSignInLink", () => {
  it("sends a guest to sign in and back to the product, even without JavaScript", async () => {
    const html = renderToString(<FavoriteSignInLink returnTo={RETURN_TO} />);
    expect(html).toContain(
      'href="/cuenta/ingresar?volver=%2Fproductos%2Fsoundcore-liberty-5"',
    );

    const { container } = render(<FavoriteSignInLink returnTo={RETURN_TO} />);
    expect(
      screen.getByRole("link", { name: "Guardar en favoritos" }),
    ).toHaveAccessibleDescription(
      "Ingresa a tu cuenta para guardar tus favoritos.",
    );
    await expectNoAxeViolations(container);
  });
});
