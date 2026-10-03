import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type AccountPageProps = {
  /** The page's h1, e.g. "Mis pedidos". */
  title: string;
  description?: ReactNode;
  /** The account navigation (`AccountNav`). */
  nav: ReactNode;
  /** A short confirmation after a change ("Guardamos tus datos."). */
  notice?: string | null;
  children: ReactNode;
};

/**
 * A signed-in account page: the h1 with an optional description and notice
 * (a polite status), the account navigation (above the content on phones,
 * a left column from `lg`) and the page content.
 */
export function AccountPage({
  title,
  description,
  nav,
  notice,
  children,
}: AccountPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-2">
        <Heading level={1} size="display-l">
          {title}
        </Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </div>
      {notice ? (
        <p
          role="status"
          className="rounded-md border border-border bg-surface-raised px-4 py-3 text-body-sm text-foreground"
        >
          {notice}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-12">
        <div className="lg:sticky lg:top-36">{nav}</div>
        <div className="flex min-w-0 flex-col gap-10">{children}</div>
      </div>
    </div>
  );
}
