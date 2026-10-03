import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollReveal } from "./scroll-reveal";

// GSAP needs layout and requestAnimationFrame: it is replaced by spies. The
// matchMedia context runs its callback only when the query matches.
const media = vi.hoisted(() => ({ matches: true }));
const context = vi.hoisted(() => ({
  add: vi.fn((_query: string, callback: () => void) => {
    if (media.matches) callback();
  }),
  revert: vi.fn(),
}));
const gsap = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  matchMedia: vi.fn(() => context),
  from: vi.fn(),
}));
const ScrollTrigger = vi.hoisted(() => ({ isInViewport: vi.fn(() => false) }));

vi.mock("gsap", () => ({ default: gsap, gsap }));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger }));

describe("ScrollReveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    media.matches = true;
    ScrollTrigger.isInViewport.mockReturnValue(false);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: media.matches })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children, visible, inside a wrapper", () => {
    render(
      <ScrollReveal>
        <p>Destacados</p>
      </ScrollReveal>,
    );

    expect(screen.getByText("Destacados")).toBeVisible();
    expect(screen.getByText("Destacados").parentElement).toHaveAttribute(
      "data-slot",
      "scroll-reveal",
    );
  });

  it("reveals the section on scroll only when motion is allowed", () => {
    render(<ScrollReveal>Destacados</ScrollReveal>);

    expect(gsap.registerPlugin).toHaveBeenCalledWith(ScrollTrigger);
    expect(context.add).toHaveBeenCalledWith(
      "(prefers-reduced-motion: no-preference)",
      expect.any(Function),
    );
    const [target, vars] = gsap.from.mock.calls[0] as unknown as [
      HTMLElement,
      Record<string, unknown>,
    ];
    expect(target).toHaveAttribute("data-slot", "scroll-reveal");
    expect(vars).toMatchObject({
      autoAlpha: 0,
      scrollTrigger: { trigger: target, once: true },
    });
  });

  it("does not animate under reduced motion", () => {
    media.matches = false;
    render(<ScrollReveal>Destacados</ScrollReveal>);

    expect(gsap.from).not.toHaveBeenCalled();
  });

  it("never hides a section that is already on screen", () => {
    ScrollTrigger.isInViewport.mockReturnValue(true);
    render(<ScrollReveal>Destacados</ScrollReveal>);

    expect(gsap.from).not.toHaveBeenCalled();
  });

  it("does nothing where matchMedia is missing", () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<ScrollReveal>Destacados</ScrollReveal>);

    expect(gsap.matchMedia).not.toHaveBeenCalled();
    expect(screen.getByText("Destacados")).toBeVisible();
  });

  it("reverts its animations on unmount", () => {
    const { unmount } = render(<ScrollReveal>Destacados</ScrollReveal>);

    unmount();

    expect(context.revert).toHaveBeenCalledTimes(1);
  });
});
