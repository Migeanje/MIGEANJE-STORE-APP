import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "@/app/error";
import { expectNoAxeViolations } from "@/test/a11y";

const failure = Object.assign(new Error("Boom"), { digest: "123" });

describe("ErrorPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("explains the problem and offers a retry and a way home", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const retry = vi.fn();
    const { container } = render(<ErrorPage error={failure} retry={retry} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Algo salió mal" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );

    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledTimes(1);
    await expectNoAxeViolations(container);
  });

  it("logs the error for diagnosis", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorPage error={failure} retry={() => {}} />);

    expect(log).toHaveBeenCalledWith(failure);
  });
});
