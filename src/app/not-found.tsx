import Link from "next/link";
import { CategoryShortcutsContainer } from "@/modules/catalog/ui/category-shortcuts.container";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

/** 404 for `notFound()` and every unmatched URL, inside the root layout. */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-12 px-4 py-24 sm:px-8">
      <section className="flex flex-col items-start gap-6">
        <Text mono size="body-sm" tone="muted">
          Error 404
        </Text>
        <Heading level={1} size="display-l" className="text-balance">
          No encontramos esta página
        </Heading>
        <Text tone="muted" className="max-w-prose">
          Puede que el enlace tenga un error o que la página ya no exista.
          Vuelve al inicio o explora nuestras categorías.
        </Text>
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </section>
      <CategoryShortcutsContainer />
    </div>
  );
}
