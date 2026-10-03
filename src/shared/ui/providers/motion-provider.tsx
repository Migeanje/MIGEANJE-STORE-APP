"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { type ReactNode, useEffect } from "react";

// GSAP's own lag smoothing defaults, restored when the provider unmounts.
const GSAP_LAG_THRESHOLD = 500;
const GSAP_LAG_ADJUSTED = 33;

export type MotionProviderProps = {
  children: ReactNode;
};

/**
 * Smooth scroll for the discovery pages only (home, category, product, brand,
 * search): one Lenis instance on the window, driven by GSAP's ticker and
 * synced with ScrollTrigger, so scroll-linked animations follow it. Those
 * animations must use `gsap.matchMedia()` and stay off under reduced motion.
 *
 * Lenis honors `prefers-reduced-motion` itself (no smoothing, instant
 * programmatic scrolls). Anchors stay native, so the skip link moves focus.
 * Unmounting (navigating to cart, checkout, account...) restores native scroll.
 * Scrollable overlays opt out with `data-lenis-prevent`.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);

    // GSAP's ticker time is in seconds; Lenis expects milliseconds.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(GSAP_LAG_THRESHOLD, GSAP_LAG_ADJUSTED);
      lenis.destroy();
    };
  }, []);

  return children;
}
