import { CompareTrayBar } from "@/modules/catalog/ui/compare-tray-bar";
import { MotionProvider } from "@/shared/ui/providers";

/**
 * Discovery pages (home, category, product, brand, search, comparator):
 * smooth scroll and scroll-linked GSAP animations, plus the compare tray bar
 * stuck to the bottom of the viewport. Native scroll everywhere else.
 */
export default function DiscoveryLayout({ children }: LayoutProps<"/">) {
  return (
    <MotionProvider>
      {children}
      <CompareTrayBar />
    </MotionProvider>
  );
}
