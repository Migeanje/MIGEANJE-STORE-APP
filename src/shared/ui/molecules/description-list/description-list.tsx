import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type DescriptionListItem = {
  term: string;
  /** One value, or one line per entry (e.g. an address). */
  details: ReactNode | readonly string[];
  /** Data such as numbers and codes, in Geist Mono. */
  mono?: boolean;
  /** Long text typed by someone: keeps its line breaks. */
  preformatted?: boolean;
};

export type DescriptionListProps = Omit<ComponentProps<"dl">, "children"> & {
  items: readonly DescriptionListItem[];
  /** Pairs per row from the `sm` breakpoint. Defaults to 1. */
  columns?: 1 | 2;
};

function isLines(details: DescriptionListItem["details"]): details is string[] {
  return Array.isArray(details);
}

/**
 * Labelled values (`dl`): a muted term above each value, in one or two
 * columns. Multi-line values put each line on its own line.
 */
export function DescriptionList({
  items,
  columns = 1,
  className,
  ...props
}: DescriptionListProps) {
  return (
    <dl
      {...props}
      className={cn(
        "grid gap-4",
        columns === 2 ? "sm:grid-cols-2" : null,
        className,
      )}
    >
      {items.map(({ term, details, mono = false, preformatted = false }) => (
        <div key={term} className="flex min-w-0 flex-col gap-1">
          <dt className="text-body-sm text-muted-foreground">{term}</dt>
          <dd
            className={cn(
              "text-body text-foreground break-words",
              mono && "font-mono",
              preformatted && "whitespace-pre-line",
              isLines(details) && "flex flex-col",
            )}
          >
            {isLines(details)
              ? details.map((line) => <span key={line}>{line}</span>)
              : details}
          </dd>
        </div>
      ))}
    </dl>
  );
}
