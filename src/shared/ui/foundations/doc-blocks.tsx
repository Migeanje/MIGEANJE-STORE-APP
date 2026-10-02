// Documentation helpers for the Foundations stories. They are NOT design-system
// components: never import them from app or module code.

import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { readCssVar } from "./css-vars";

/**
 * Reads CSS custom properties from <html> after mount, so the docs show the
 * values tokens.css actually ships. Missing properties come back as "".
 */
export function useCssVars(names: readonly string[]): Record<string, string> {
  const key = names.join(" ");
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setValues(
      Object.fromEntries(
        key.split(" ").map((name) => [name, readCssVar(style, name)]),
      ),
    );
  }, [key]);
  return values;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Live `prefers-reduced-motion: reduce` state (false on the server). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function DocPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex max-w-5xl flex-col gap-12 p-6 sm:p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-display-l text-balance">{title}</h1>
        <p className="max-w-prose text-body text-muted-foreground">{intro}</p>
      </header>
      {children}
    </div>
  );
}

export function DocSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-title">{title}</h2>
        {description ? (
          <p className="max-w-prose text-body-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** CSS variable name or value, set in Geist Mono like any other data. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-caption text-muted-foreground">
      {children}
    </code>
  );
}

/** Shown when a token is not present in the computed styles. */
export const MISSING_VALUE = "not emitted";

export function Swatch({
  name,
  variable,
  value,
  note,
}: {
  name: string;
  variable: string;
  value: string;
  note?: string;
}) {
  return (
    <figure className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div
        aria-hidden="true"
        className="h-20 rounded-md border"
        style={{ background: `var(${variable})` }}
      />
      <figcaption className="flex flex-col gap-1 px-1">
        <span className="text-body-sm font-medium">{name}</span>
        <Code>{variable}</Code>
        <Code>{value || MISSING_VALUE}</Code>
        {note ? (
          <span className="text-caption text-muted-foreground">{note}</span>
        ) : null}
      </figcaption>
    </figure>
  );
}
