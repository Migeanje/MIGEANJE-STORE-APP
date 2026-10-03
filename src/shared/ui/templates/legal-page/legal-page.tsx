import { FilePenLine } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useId } from "react";
import { cn } from "@/shared/lib/cn";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type LegalSection = {
  /** In-page anchor: lowercase letters, digits and hyphens, unique. */
  id: string;
  /** The section's h2 and its table of contents entry. */
  title: string;
  /** Paragraphs (`Text`), lists, h3 subsections, tables. */
  content: ReactNode;
};

export type LegalPageLink = { href: string; label: string };

export type LegalPageProps = {
  title: string;
  /** One or two sentences under the title. */
  intro?: ReactNode;
  /** "Última actualización": visible text + ISO date (YYYY-MM-DD). */
  updatedAt: { label: string; dateTime: string };
  /**
   * Shows the "Borrador pendiente de revisión legal" banner with this
   * detail (e.g. what is still to confirm). Omit for a reviewed text.
   */
  draftNote?: string;
  sections: readonly LegalSection[];
  /** "En esta página" with in-page links. Defaults to 3 or more sections. */
  toc?: boolean;
  /** "También te puede servir": related pages, after the sections. */
  related?: readonly LegalPageLink[];
};

const SECTION_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Throws a RangeError for anchors or dates that would break the page. */
function assertValid({ sections, updatedAt }: LegalPageProps) {
  const seen = new Set<string>();
  for (const { id } of sections) {
    if (!SECTION_ID.test(id)) {
      throw new RangeError(
        `LegalPage section id must be lowercase letters, digits and hyphens, got "${id}"`,
      );
    }
    if (seen.has(id)) {
      throw new RangeError(`LegalPage section id "${id}" is used twice`);
    }
    seen.add(id);
  }
  if (!ISO_DATE.test(updatedAt.dateTime)) {
    throw new RangeError(
      `LegalPage updatedAt.dateTime must be YYYY-MM-DD, got "${updatedAt.dateTime}"`,
    );
  }
}

const LINK =
  "text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Long-form content: lists, links, subsections and tables passed as children
// get the same rhythm without a typography plugin.
const PROSE = cn(
  "flex flex-col gap-4 text-body text-foreground",
  "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
  "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5",
  "[&_li]:pl-1 [&_li]:text-pretty [&_p]:text-pretty [&_strong]:font-medium",
  "[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:no-underline",
  "[&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-ring",
  "[&_table]:w-full [&_table]:border-y [&_table]:text-left [&_table]:text-body-sm",
  "[&_caption]:pb-2 [&_caption]:text-left [&_caption]:text-muted-foreground",
  "[&_tr]:border-b [&_th]:py-3 [&_th]:pr-4 [&_th]:align-top [&_th]:font-medium",
  "[&_td]:py-3 [&_td]:pr-4 [&_td]:align-top [&_td]:text-pretty",
);

/**
 * A readable legal or trust page (términos, privacidad, garantías...): the
 * title, intro and "Última actualización", an optional draft banner, a table
 * of contents with in-page links (sticky beside the text on wide screens),
 * the sections (each an h2 region with an anchor) at about 68 characters per
 * line, and related links. Native scroll: anchors leave room for the sticky
 * site header.
 */
export function LegalPage(props: LegalPageProps) {
  assertValid(props);
  const { title, intro, updatedAt, draftNote, sections, related } = props;
  const toc = props.toc ?? sections.length >= 3;
  const tocHeadingId = useId();
  const relatedHeadingId = useId();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:py-16">
      <header className="flex max-w-[68ch] flex-col gap-4">
        <Heading level={1} size="display-l" className="text-balance">
          {title}
        </Heading>
        {intro ? (
          <Text tone="muted" className="text-pretty">
            {intro}
          </Text>
        ) : null}
        <Text size="body-sm" tone="muted">
          Última actualización:{" "}
          <time dateTime={updatedAt.dateTime} className="text-foreground">
            {updatedAt.label}
          </time>
        </Text>
        {draftNote ? (
          <div className="flex gap-3 rounded-lg border border-input bg-surface-raised p-4">
            <FilePenLine
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <Text size="body-sm" className="text-pretty">
              <strong className="font-medium">
                Borrador pendiente de revisión legal.
              </strong>{" "}
              {draftNote}
            </Text>
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          "flex flex-col gap-10",
          toc &&
            "lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-16",
        )}
      >
        {toc ? (
          <nav
            aria-labelledby={tocHeadingId}
            className="flex flex-col gap-3 rounded-lg border bg-card p-5 lg:sticky lg:top-32"
          >
            <h2
              id={tocHeadingId}
              className="text-body-sm font-medium text-foreground"
            >
              En esta página
            </h2>
            <ol className="flex flex-col gap-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-flex min-h-9 items-center text-body-sm text-muted-foreground transition-colors duration-(--duration-fast) ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="flex min-w-0 max-w-[68ch] flex-col gap-12">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-titulo`}
              className="flex scroll-mt-32 flex-col gap-4"
            >
              <Heading
                id={`${section.id}-titulo`}
                level={2}
                className="text-balance"
              >
                {section.title}
              </Heading>
              <div className={PROSE}>{section.content}</div>
            </section>
          ))}

          {related && related.length > 0 ? (
            <nav
              aria-labelledby={relatedHeadingId}
              className="flex flex-col gap-3 border-t pt-8"
            >
              <h2
                id={relatedHeadingId}
                className="text-body font-medium text-foreground"
              >
                También te puede servir
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {related.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
