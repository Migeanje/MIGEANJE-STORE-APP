"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ComponentProps, useEffect, useRef } from "react";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
// --duration-slow (480ms, "section reveal") in seconds.
const REVEAL_SECONDS = 0.48;
const REVEAL_OFFSET_PX = 24;
// expo.out matches the ease-out token, cubic-bezier(0.16, 1, 0.3, 1).
const REVEAL_EASE = "expo.out";

export type ScrollRevealProps = ComponentProps<"div">;

/**
 * Fades and lifts a section in the first time it scrolls into view (discovery
 * pages only, inside the MotionProvider). It never hides content that is
 * already on screen, and does nothing under reduced motion
 * (`gsap.matchMedia()`), where matchMedia is missing, or before hydration:
 * without JavaScript the section is simply there.
 */
export function ScrollReveal({ children, ...props }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null || typeof window.matchMedia !== "function") return;

    // Child effects run before the MotionProvider's: register here too.
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(MOTION_OK, () => {
      if (ScrollTrigger.isInViewport(element)) return;
      gsap.from(element, {
        autoAlpha: 0,
        y: REVEAL_OFFSET_PX,
        duration: REVEAL_SECONDS,
        ease: REVEAL_EASE,
        scrollTrigger: { trigger: element, start: "top 85%", once: true },
      });
    });
    return () => media.revert();
  }, []);

  return (
    <div {...props} ref={ref} data-slot="scroll-reveal">
      {children}
    </div>
  );
}
