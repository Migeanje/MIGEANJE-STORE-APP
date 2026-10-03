import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import DiscoveryLayout from "@/app/(discovery)/layout";
import TransactionalLayout from "@/app/(transactional)/layout";

vi.mock("@/modules/catalog/ui/compare-tray-bar", () => ({
  CompareTrayBar: () => <div data-testid="compare-tray-bar" />,
}));

vi.mock("@/shared/ui/providers", () => ({
  MotionProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="motion-provider">{children}</div>
  ),
}));

type LayoutParams = Parameters<typeof DiscoveryLayout>[0]["params"];
const params = Promise.resolve({}) as LayoutParams;

describe("route group layouts", () => {
  it("wraps discovery pages in the MotionProvider (Lenis + GSAP)", () => {
    render(
      <DiscoveryLayout params={params}>
        <p>Inicio</p>
      </DiscoveryLayout>,
    );

    expect(screen.getByTestId("motion-provider")).toContainElement(
      screen.getByText("Inicio"),
    );
  });

  it("shows the compare tray bar after discovery pages only", () => {
    const { unmount } = render(
      <DiscoveryLayout params={params}>
        <p>Inicio</p>
      </DiscoveryLayout>,
    );
    expect(screen.getByTestId("compare-tray-bar")).toBeInTheDocument();
    unmount();

    render(
      <TransactionalLayout params={params}>
        <p>Carrito</p>
      </TransactionalLayout>,
    );
    expect(screen.queryByTestId("compare-tray-bar")).toBeNull();
  });

  it("keeps native scroll on transactional pages", () => {
    render(
      <TransactionalLayout params={params}>
        <p>Carrito</p>
      </TransactionalLayout>,
    );

    expect(screen.getByText("Carrito")).toBeInTheDocument();
    expect(screen.queryByTestId("motion-provider")).toBeNull();
  });
});
