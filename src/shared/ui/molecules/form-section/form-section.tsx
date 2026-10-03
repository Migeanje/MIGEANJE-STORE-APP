import { type ComponentProps, type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type FormSectionProps = Omit<ComponentProps<"section">, "title"> & {
  /** E.g. "1. Identificación del consumidor reclamante". */
  title: ReactNode;
  /** Outline level of the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
  /** Under the title, announced as the section's description. */
  description?: ReactNode;
  children: ReactNode;
};

/**
 * A numbered part of a long form on a card: a region named by its heading
 * (so it shows up in the landmarks and heading lists), an optional
 * description and the fields. Fields keep their own fieldsets for groups of
 * radios or selects.
 */
export function FormSection({
  title,
  headingLevel = 2,
  description,
  className,
  children,
  ...props
}: FormSectionProps) {
  const headingId = useId();
  const descriptionId = useId();
  const hasDescription = !isEmptyNode(description);

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      aria-describedby={hasDescription ? descriptionId : undefined}
      className={cn(
        "flex flex-col gap-6 rounded-lg border bg-card p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <Heading
          id={headingId}
          level={headingLevel}
          size="title"
          className="text-balance"
        >
          {title}
        </Heading>
        {hasDescription ? (
          <Text
            id={descriptionId}
            size="body-sm"
            tone="muted"
            className="text-pretty"
          >
            {description}
          </Text>
        ) : null}
      </div>
      {children}
    </section>
  );
}
