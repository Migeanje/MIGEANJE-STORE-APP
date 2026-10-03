import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/(discovery)/page";

vi.mock("@/modules/catalog/ui/home.container", () => ({
  HomeContainer: () => <p>Contenido del inicio</p>,
}));

describe("HomePage", () => {
  it("renders the home container", () => {
    render(<HomePage />);

    expect(screen.getByText("Contenido del inicio")).toBeInTheDocument();
  });
});
