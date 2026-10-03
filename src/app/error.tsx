"use client"; // Error boundaries must be Client Components.

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Re-fetches and re-renders the failed segment (Next.js 16.3+). */
  retry: () => void;
};

/** Error boundary for every page under the root layout (header and footer stay). */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-8">
      <Heading level={1} size="display-l">
        Algo salió mal
      </Heading>
      <Text tone="muted" className="max-w-prose">
        No pudimos cargar esta página. Vuelve a intentarlo en unos segundos; si
        el problema sigue, regresa al inicio.
      </Text>
      <div className="flex flex-wrap gap-3">
        <Button leadingIcon={<RotateCw />} onClick={() => retry()}>
          Reintentar
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </section>
  );
}
