import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useHydrated } from "./use-hydrated";

function Probe() {
  return <p>{useHydrated() ? "hidratado" : "sin JavaScript"}</p>;
}

describe("useHydrated", () => {
  it("is false in the server HTML", () => {
    expect(renderToString(<Probe />)).toContain("sin JavaScript");
  });

  it("is true on the client", () => {
    render(<Probe />);

    expect(screen.getByText("hidratado")).toBeInTheDocument();
  });
});
