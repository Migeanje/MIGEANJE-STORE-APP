import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type Feature = { title: string; description: string };

export type FeatureStripProps = Omit<
  ComponentProps<"section">,
  "children" | "title"
> & {
  title: string;
  items: readonly Feature[];
  /** Outline level of the title; items sit one level below. Defaults to 2. */
  headingLevel?: 2 | 3 | 4 | 5;
};

/**
 * A titled strip of short value statements (e.g. "Por qué Migeanje"): one
 * column on phones, three from `md`, each item separated by a hairline with an
 * amber tick.
 */
export function FeatureStrip({
  title,
  items,
  headingLevel = 2,
  className,
  ...props
}: FeatureStripProps) {
  const headingId = useId();
  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-8", className)}
    >
      <Heading id={headingId} level={headingLevel}>
        {title}
      </Heading>
      <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {items.map(({ title: itemTitle, description }) => (
          <li
            key={itemTitle}
            className="relative flex flex-col gap-2 border-t pt-6 before:absolute before:-top-px before:left-0 before:h-px before:w-8 before:bg-primary"
          >
            <Heading
              level={(headingLevel + 1) as HeadingLevel}
              className="text-body font-medium"
            >
              {itemTitle}
            </Heading>
            <Text tone="muted" className="text-pretty">
              {description}
            </Text>
          </li>
        ))}
      </ul>
    </section>
  );
}
