"use client";

import { CircleAlert } from "lucide-react";
import {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  useId,
} from "react";
import { cn } from "@/shared/lib/cn";
import { isEmptyNode } from "@/shared/lib/react-node";
import { Heading, type HeadingLevel } from "@/shared/ui/atoms/heading";

export type ErrorSummaryItem = {
  /** Id of the field with the error: the link points at it. */
  fieldId: string;
  message: string;
};

export type ErrorSummaryProps = Omit<
  ComponentProps<"section">,
  "children" | "title"
> & {
  /** Defaults to "Revisa estos datos". */
  title?: string;
  /** Outline level of the title. Defaults to 2. */
  headingLevel?: HeadingLevel;
  /** A message about the whole form, e.g. a declined card. */
  message?: ReactNode;
  /** One link per field error, in form order. */
  items: readonly ErrorSummaryItem[];
};

/**
 * The errors of a form after a failed submit, at its top: a focusable region
 * (tabIndex −1, so the form can move focus to it) titled by its heading, an
 * optional message and one link per field error. Following a link focuses the
 * field (plain anchors without JavaScript). Renders nothing without errors.
 */
export function ErrorSummary({
  title = "Revisa estos datos",
  headingLevel = 2,
  message,
  items,
  className,
  ...props
}: ErrorSummaryProps) {
  const headingId = useId();
  if (items.length === 0 && isEmptyNode(message)) return null;

  function focusField(event: MouseEvent<HTMLAnchorElement>, fieldId: string) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    // Focusing also scrolls the field into view.
    event.preventDefault();
    field.focus();
  }

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      tabIndex={-1}
      className={cn(
        "flex flex-col gap-3 rounded-lg border-2 border-destructive bg-card p-5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-destructive">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        <Heading
          id={headingId}
          level={headingLevel}
          className="text-body font-medium text-foreground"
        >
          {title}
        </Heading>
      </div>
      {isEmptyNode(message) ? null : (
        <div className="text-body-sm text-foreground">{message}</div>
      )}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.fieldId}>
              <a
                href={`#${item.fieldId}`}
                onClick={(event) => focusField(event, item.fieldId)}
                className="text-body-sm text-destructive underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {item.message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
