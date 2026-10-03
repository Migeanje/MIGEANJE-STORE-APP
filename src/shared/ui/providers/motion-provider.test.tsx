import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "./motion-provider";

// Lenis needs layout APIs jsdom lacks (ResizeObserver, real scrolling), and
// GSAP's ticker runs on requestAnimationFrame: both are replaced by spies.
const lenis = vi.hoisted(() => ({
  on: vi.fn(),
  raf: vi.fn(),
  destroy: vi.fn(),
}));
const LenisMock = vi.hoisted(() =>
  vi.fn(function Lenis() {
    return lenis;
  }),
);
const gsap = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
}));
const ScrollTrigger = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock("lenis", () => ({ default: LenisMock }));
vi.mock("gsap", () => ({ default: gsap, gsap }));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger }));

function lenisOptions(): Record<string, unknown> {
  return (LenisMock.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
}

describe("MotionProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders its children without a wrapper element", () => {
    const { container } = render(
      <MotionProvider>
        <p>Contenido</p>
      </MotionProvider>,
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(container.firstChild).toBe(screen.getByText("Contenido"));
  });

  it("starts one Lenis instance driven by GSAP's ticker and synced with ScrollTrigger", () => {
    render(<MotionProvider>Contenido</MotionProvider>);

    expect(gsap.registerPlugin).toHaveBeenCalledWith(ScrollTrigger);
    expect(LenisMock).toHaveBeenCalledTimes(1);
    expect(lenisOptions()).toMatchObject({ autoRaf: false });
    expect(lenis.on).toHaveBeenCalledWith("scroll", ScrollTrigger.update);
    expect(gsap.ticker.lagSmoothing).toHaveBeenCalledWith(0);

    // GSAP's ticker time is in seconds; Lenis expects milliseconds.
    const tick = gsap.ticker.add.mock.calls[0]?.[0] as (time: number) => void;
    tick(1.5);
    expect(lenis.raf).toHaveBeenCalledWith(1500);
  });

  it("leaves reduced motion to Lenis and keeps native anchor jumps for the skip link", () => {
    render(<MotionProvider>Contenido</MotionProvider>);

    // Lenis honors prefers-reduced-motion unless told otherwise.
    expect(lenisOptions().respectReducedMotion).not.toBe(false);
    // Lenis anchors would smooth-scroll "#contenido" without moving focus.
    expect(lenisOptions().anchors ?? false).toBe(false);
  });

  it("restores native scroll and GSAP's defaults on unmount", () => {
    const { unmount } = render(<MotionProvider>Contenido</MotionProvider>);
    const tick = gsap.ticker.add.mock.calls[0]?.[0];

    unmount();

    expect(gsap.ticker.remove).toHaveBeenCalledWith(tick);
    expect(gsap.ticker.lagSmoothing).toHaveBeenLastCalledWith(500, 33);
    expect(lenis.destroy).toHaveBeenCalledTimes(1);
  });
});
