import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type EmptyStateProps = Omit<ComponentProps<"div">, "title"> & {
  title: string;
  description?: string;
  /** Outline level of the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
  /** Actions (links or buttons) under the text. */
  children?: ReactNode;
};

/** A dead end turned into a next step: title, one line and actions. */
export function EmptyState({
  title,
  description,
  headingLevel = 2,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 sm:p-10",
        className,
      )}
    >
      <Heading level={headingLevel} className="text-balance">
        {title}
      </Heading>
      {description ? (
        <Text tone="muted" className="max-w-prose text-pretty">
          {description}
        </Text>
      ) : null}
      {children ? (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      ) : null}
    </div>
  );
}
