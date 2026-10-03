import type { ReactNode } from "react";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

export type AuthPageProps = {
  /** The page's h1, e.g. "Ingresa a tu cuenta". */
  title: string;
  description?: ReactNode;
  /** A short message about the last action, as a polite status. */
  notice?: ReactNode;
  /** The form. */
  children: ReactNode;
  /** Below the form: links to the other account pages, demo hints. */
  footer?: ReactNode;
};

/**
 * Sign-in, registration and password recovery: one narrow column (h1,
 * description, optional notice, the form on a raised card, then the links).
 */
export function AuthPage({
  title,
  description,
  notice,
  children,
  footer,
}: AuthPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-10 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-2">
        <Heading level={1} size="display-l">
          {title}
        </Heading>
        {description ? <Text tone="muted">{description}</Text> : null}
      </div>
      {notice ? (
        <div
          role="status"
          className="rounded-md border border-border bg-surface-raised px-4 py-3 text-body-sm text-foreground"
        >
          {notice}
        </div>
      ) : null}
      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        {children}
      </div>
      {footer ? (
        <div className="flex flex-col gap-3 text-body-sm">{footer}</div>
      ) : null}
    </div>
  );
}
