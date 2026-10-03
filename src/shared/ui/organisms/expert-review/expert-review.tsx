import { Check, X } from "lucide-react";
import { type ComponentProps, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading } from "@/shared/ui/atoms/heading";
import { LedScore } from "@/shared/ui/atoms/led-score";
import { Text } from "@/shared/ui/atoms/text";

export type RubricCriterion = {
  /** Unique within the rubric (used as key). */
  criterion: string;
  /** From 1 to 5. */
  score: number;
  note: string;
};

/** The editorial content of a review ("Cómo elegimos"). */
export type ExpertReviewContent = {
  /** One or two sentences. */
  verdict: string;
  forWhom: readonly string[];
  notFor: readonly string[];
  rubric: readonly RubricCriterion[];
};

export type ExpertReviewProps = Omit<
  ComponentProps<"section">,
  "children" | "title"
> &
  ExpertReviewContent & {
    /** Defaults to "Nuestra opinión". */
    title?: string;
    /** Outline level of the title; the lists sit one level below. Defaults to 2. */
    headingLevel?: 2 | 3 | 4;
  };

const LIST_ICON = "mt-0.5 size-4 shrink-0";

/**
 * Our opinion on a product: the verdict, who it is for and who it is not
 * for, and the rubric with each criterion scored as LED dots plus a note.
 * The section is a region named by its title.
 */
export function ExpertReview({
  verdict,
  forWhom,
  notFor,
  rubric,
  title = "Nuestra opinión",
  headingLevel = 2,
  className,
  ...props
}: ExpertReviewProps) {
  const headingId = useId();
  const subLevel = (headingLevel + 1) as 3 | 4 | 5;

  return (
    <section
      {...props}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-8", className)}
    >
      <div className="flex flex-col gap-3">
        <Heading id={headingId} level={headingLevel}>
          {title}
        </Heading>
        <Text className="max-w-prose text-pretty">{verdict}</Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
          <Heading level={subLevel} className="text-body font-medium">
            Para quién es
          </Heading>
          <ul className="flex flex-col gap-2">
            {forWhom.map((line) => (
              <li key={line} className="flex gap-2 text-body-sm">
                <Check
                  aria-hidden="true"
                  className={cn(LIST_ICON, "text-primary")}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
          <Heading level={subLevel} className="text-body font-medium">
            Para quién no es
          </Heading>
          <ul className="flex flex-col gap-2">
            {notFor.map((line) => (
              <li key={line} className="flex gap-2 text-body-sm">
                <X
                  aria-hidden="true"
                  className={cn(LIST_ICON, "text-muted-foreground")}
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Heading level={subLevel} className="text-body font-medium">
          Cómo lo evaluamos
        </Heading>
        <dl className="divide-y divide-border border-y">
          {rubric.map(({ criterion, score, note }) => (
            <div
              key={criterion}
              className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-6"
            >
              <dt className="text-body-sm font-medium text-foreground">
                {criterion}
              </dt>
              <dd className="flex flex-col items-start gap-1">
                <LedScore score={score} />
                <Text as="span" size="body-sm" tone="muted">
                  {note}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
