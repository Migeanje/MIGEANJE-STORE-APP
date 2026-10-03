import { MotionProvider } from "@/shared/ui/providers";

/**
 * Discovery pages (home, category, product, brand, search): smooth scroll and
 * scroll-linked GSAP animations. Native scroll everywhere else.
 */
export default function DiscoveryLayout({ children }: LayoutProps<"/">) {
  return <MotionProvider>{children}</MotionProvider>;
}
