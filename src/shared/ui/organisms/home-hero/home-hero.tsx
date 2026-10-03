import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type HomeHeroProps = Omit<ComponentProps<"section">, "children"> & {
  /** The page's h1, short: it renders at display-xl. */
  headline: string;
  /** One short line under the headline. */
  lead: string;
  /** Primary call to action, e.g. a category page. */
  cta: { href: string; label: string };
};

/**
 * Home hero without imagery: a display-xl headline, a short line and one
 * call to action over a warm amber glow. No loader: the text is visible and
 * usable from the first frame while the glow "warms up" (fades in over
 * `--duration-story` with CSS `@starting-style`; instant with reduced motion).
 */
export function HomeHero({
  headline,
  lead,
  cta,
  className,
  ...props
}: HomeHeroProps) {
  const headingId = useId();
  return (
    <section
      {...props}
      aria-labelledby={headingId}
      // overflow-hidden: the glow never causes horizontal scroll on phones.
      className={cn("relative isolate overflow-hidden", className)}
    >
      <div
        data-slot="glow"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-1/4 left-1/2 -z-10 aspect-square w-[160%] max-w-5xl -translate-x-1/4 sm:w-full",
          "bg-radial-[closest-side] from-primary/25 via-primary/5 to-transparent",
          // "Encendido" on load: the light ramps in; content never waits for it.
          "opacity-100 transition-opacity duration-(--duration-story) ease-out starting:opacity-0",
        )}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 pt-20 pb-16 sm:px-8 lg:pt-32 lg:pb-24">
        <Heading
          id={headingId}
          level={1}
          size="display-xl"
          className="max-w-4xl text-balance"
        >
          {headline}
        </Heading>
        <Text tone="muted" className="max-w-xl text-pretty sm:text-title">
          {lead}
        </Text>
        <Button asChild size="lg" trailingIcon={<ArrowRight />}>
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </div>
    </section>
  );
}
