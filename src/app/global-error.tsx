"use client"; // Error boundaries must be Client Components.

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { geistMono, geistSans } from "@/shared/ui/tokens/fonts";
import "./globals.css";

/**
 * Last-resort error page for failures in the root layout itself (e.g. the
 * header or footer data). It replaces the whole document, so it brings its
 * own <html>, styles and fonts, and links home with a plain anchor.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="es-PE"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <title>Algo salió mal · Migeanje Store</title>
        <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col items-start justify-center gap-6 px-4 py-24 sm:px-8">
          <Heading level={1} size="display-l">
            Algo salió mal
          </Heading>
          <Text tone="muted" className="max-w-prose">
            No pudimos cargar la tienda. Vuelve a intentarlo en unos segundos.
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button leadingIcon={<RotateCw />} onClick={() => retry()}>
              Reintentar
            </Button>
            <Button asChild variant="secondary">
              {/* A full page load: the root layout may be what failed. */}
              <a href="/">Ir al inicio</a>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
